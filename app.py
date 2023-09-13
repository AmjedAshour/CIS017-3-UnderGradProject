from flask import Flask, request as fRequest, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS, cross_origin
import openai
import json
from virus_total_apis import PublicApi as VirusTotalPublicApi
import urllib.request
import urllib.parse
import time



app = Flask(__name__)
mysql = MySQL(app)
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, resources={r"/api/*": {"origins": "*"}})

def extract_urls_from_email(anchor):
    urls_list = []
    for key in anchor:
        if 'url' in key:
            urls_list.append(key['url'])
    return urls_list

def extract_files_from_email(attachment):
    files_list = []
    for key in attachment:
        if 'href' in key:
            files_list.append(key['href'])
    return files_list

def scan_urls_for_malicious_content(urls_list):
    threats = []
    vt_key = "YOUR VIRUSTOTAL API KEY"
    vt = VirusTotalPublicApi(vt_key)
    for i in urls_list:
        resp_url = vt.get_url_report(i)
        res_url = json.dumps(resp_url, sort_keys=False, indent=4)
        res_url_counts = json.loads(res_url)

        if 'positives' in res_url_counts:
            API_KEY = "YOUR GOOGLE SAFEBROWSING API KEY"
            URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + API_KEY
            urls = ["https://example.com", "https://malware.com"]
            threat_info = {
                "threatInfo": {
                    "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": url} for url in urls]
                }
            }
            request_data = json.dumps(threat_info).encode()

            request = urllib.request.Request(URL, data=request_data, headers={"Content-Type": "application/json"})
            response = urllib.request.urlopen(request)

            # Parse the response
            response_data = json.loads(response.read().decode())
            if response_data.get("matches"):
                for match in response_data["matches"]:
                    threats.append(f"{match['threatType']} threat found in {match['threat']['url']}")
    return threats

def scan_files_for_malicious_content(files_list):
    file_positive_count = 0
    vt_key = "YOUR VIRUSTOTAL API KEY"
    vt = VirusTotalPublicApi(vt_key)
    for i in files_list:
        resp_file = vt.get_url_report(i)
        res_file = json.dumps(resp_file,sort_keys=False, indent=4)
        res_file_counts = json.loads(res_file)

        if 'positives' in res_file_counts:
            if res_file_counts['positives'] > file_positive_count:
                file_positive_count = res_file_counts['positives']
    return file_positive_count

def generate_text_prompt(sender, title, mainBody):
    prompt = f"""
    Please analyze the following email and provide your opinion on whether it appears to be a phishing email or not. The email contains the following information:
    Sender: {sender}
    Title: {title}
    Body: {mainBody}
    Based on the contents of the email, please provide your opinion on whether it appears to be a phishing attempt or not. If you believe the email may be a phishing attempt. Phishing emails often contain malicious links or files that can harm your computer or steal your personal information. If you're unsure about the legitimacy of an email, you can always reach out to your organization's IT department for assistance.
    Please provide an explanation of why you believe the email is or is not a phishing email and tell me why you.
    """
    return prompt

@app.route('/', methods=['POST'])
@cross_origin(origin='localhost', headers=['Content-Type', 'Authorization'])
def analyse():
    start_time = time.perf_counter()
    vt_key = "YOUR VIRUSTOTAL API KEY"
    vt = VirusTotalPublicApi(vt_key)
    OA_key = "YOUR OPENAI API KEY"
    openai.api_key = OA_key
    model = "text-davinci-003"

    body = fRequest.get_json('body')
    title = body['title']
    sender = body['sender']
    mainBody = body['body']
    anchor = body['anchor']
    attachment = body['attachments']

    urls_list = extract_urls_from_email(anchor)
    threats = scan_urls_for_malicious_content(urls_list)

    files_list = extract_files_from_email(attachment)
    file_positive_count = scan_files_for_malicious_content(files_list)

    prompt = generate_text_prompt(sender, title, mainBody)
    generate_text = openai.Completion.create(engine=model, prompt=prompt, max_tokens=512, n=1, stop=None, temperature=0.7, echo=False, best_of=3)
    grammar_check = generate_text.choices[0].text.strip()

    sentiment_prompt = f'Please analyze this text {grammar_check} and classify its sentiment as either Positive or Negative in one word.'
    sentiment_analysis = openai.Completion.create(engine=model,prompt=sentiment_prompt,temperature=0.5,max_tokens = 512,n=1,stop=None,frequency_penalty=0,presence_penalty=0)
    sentiment = sentiment_analysis.choices[0].text.strip()

    end_time = time.perf_counter()
    respone_time = end_time - start_time
    print(respone_time)

    if len(threats) > 0 or file_positive_count > 0 or sentiment =='Negative':
        return jsonify({'grammarUrl': grammar_check, 'textUrl': urls_list, 'textFile': files_list})
    elif len(threats) == 0 and file_positive_count == 0 and sentiment =='Negative':
        return jsonify({'grammarUrl': grammar_check, 'textUrl': urls_list, 'textFile': files_list})
    elif (len(threats) > 0 or file_positive_count > 0) and sentiment =='Positive':
        return jsonify({'grammarUrl': grammar_check, 'textUrl': urls_list, 'textFile': files_list})
    else:
        return jsonify({'grammarUrl': grammar_check})
    

if __name__ == '__main__':
    app.run(debug=True)
