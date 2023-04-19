let initialUrl = location.href;

function checkEmailUrl() {
  if (location.href !== initialUrl) {
    console.log("URL has changed. Calling extractEmailData()...");
    extractEmailData();
    initialUrl = location.href;
  }
}

console.log("Initial check...");
checkEmailUrl();

setInterval(checkEmailUrl, 5000);


function extractEmailData() {
  const titleElement = document.querySelector('h2.hP');
  const title = titleElement.textContent;

  const senderElement = document.querySelector("span.go");
  const senderRaw = senderElement ? senderElement.textContent.trim() : "Sender not found";
  const sender = senderRaw.replace(/(^[^\w]+|[^\w]+$)/g, '');

  // Extract email body
  const emailBodyElement = document.querySelector(".a3s.aiL");
  const emailBody = emailBodyElement ? emailBodyElement.innerText : "Email body not found";

  // Extract hyperlinks
  const hyperlinks = Array.from(emailBodyElement.querySelectorAll("a"))
    .map((a) => ({
      url: a.href,
      text: a.innerText,
    }))
    .filter((link) => link.url !== "");

  // Extract attachments
  const attachments = Array.from(document.querySelectorAll('[class*="aQH"]'))
  .map((attachment) => {
    const fileUrls = Array.from(attachment.querySelectorAll('[class*="aZo"] [class*="aQy"]')).map((fileUrl) => {
      console.log("href:", fileUrl.href);
      const downloadUrl = fileUrl.href;
      return {
        href: downloadUrl,
      };
    });
    return fileUrls;
  })
  .flat();
    fetch('http://localhost:5000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: sender,
          body: emailBody,
          anchor: hyperlinks,
          attachments: attachments,
          title: title
        })
      }).then(response => response.json())
      .then(data => {
        const keys = Object.keys(data);
        if(keys.length ===3 && keys[0] ==='grammarUrl'){
          const backdrop = document.createElement('div');
          backdrop.style.position = 'fixed';
          backdrop.style.top = '0';
          backdrop.style.left = '0';
          backdrop.style.width = '100%';
          backdrop.style.height = '100%';
          backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
          backdrop.style.zIndex = '9998';
          document.body.appendChild(backdrop);
  
          const modal = document.createElement('div');
          modal.style.position = 'fixed';
          modal.style.top = '50%';
          modal.style.left = '50%';
          modal.style.transform = 'translate(-50%, -50%)';
          modal.style.width = '50vw';
          modal.style.height = 'auto';
          modal.style.borderLeft = '3px solid #dc3545';
          modal.style.borderRadius = "0.25rem";
          modal.style.backgroundColor = 'white';
          modal.style.zIndex = '9999';
          modal.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.3)';
          modal.style.borderRadius = '4px'
          modal.style.overflowWrap = 'break-word'
          modal.style.padding = '1rem'
          const header = document.createElement('h3')
          header.textContent = "Hold Up !!!"
          const textGrammar = document.createElement('p')
          textGrammar.textContent = data.grammarUrl;
          const positiveUrl = document.createElement('p')
          modal.appendChild(header);
          modal.appendChild(textGrammar);
          const closeButton = document.createElement('button');
          closeButton.textContent = 'Close (10)';
          closeButton.style.width = '6rem';
          closeButton.style.height = '3rem';
          closeButton.style.position='relative';
          closeButton.style.bottom = '1rem';
          closeButton.style.marginTop = '2rem';
          closeButton.style.left='50%';
          closeButton.style.transform = 'translateX(-50%)';
          closeButton.style.outline = 'none';
          closeButton.style.border = 'none';
          closeButton.style.color = 'white';
          closeButton.style.background = '#d8d8d8';
          closeButton.style.borderRadius = '0.25rem';
          closeButton.style.cursor = 'pointer';
          closeButton.disabled = true;
          count = 10;
          const countdownInterval = setInterval(()=>{
            count--;
            closeButton.innerText = `Close (${count}s)`;
            if (count === 0){
              clearInterval(countdownInterval);
              closeButton.disabled = false;
              closeButton.textContent = 'Close';
              closeButton.style.background = '#f13a4c';
              closeButton.style.transition = 'background 0.3s'

            }
          },1000)
          closeButton.addEventListener('click',()=>{modal.remove(); document.body.removeChild(backdrop)});
          modal.appendChild(closeButton)
          document.body.appendChild(modal)
        }
        else{
          const haDiv = document.querySelector('.ha');
          const checkMarkContainer = document.createElement('div');
          const checkMark = document.createElement('span');
          checkMark.className = 'checkMark';
          checkMark.innerHTML = '&#10003;'; // Unicode for check mark symbol
          checkMark.style.color = 'white';
          checkMark.style.fontSize = '16px';
          checkMark.style.lineHeight = '20px';
          checkMark.style.textAlign = 'center';
          checkMark.style.display = 'block';
          checkMark.style.margin = '2px';
          checkMarkContainer.appendChild(checkMark);
          checkMarkContainer.style.backgroundColor = 'green';
          checkMarkContainer.style.width = '24px';
          checkMarkContainer.style.height = '24px';
          checkMarkContainer.style.borderRadius = '50%';
          checkMarkContainer.style.display = 'flex';
          checkMarkContainer.style.alignItems = 'center';
          checkMarkContainer.style.justifyContent = 'center';
          checkMarkContainer.style.position = 'absolute';
          checkMarkContainer.style.top = '-2.5px';
          checkMarkContainer.style.right = '-30px';
          checkMarkContainer.style.margin = '5px';
          //checkMarkContainer.setAttribute('title', 'The email has been checked and is likely safe. If you think otherwise, please contact your IT department.');
          haDiv.style.position = 'relative';
          haDiv.appendChild(checkMarkContainer);
          var tooltip = document.createElement('div');
          tooltip.style.position = 'absolute';
          tooltip.style.zIndex = '999';
          tooltip.style.backgroundColor = 'rgb(40,167,69)';
          tooltip.style.color = '#0d3717';
          tooltip.style.borderRadius = '6px';
          tooltip.style.padding = '10px';
          tooltip.style.opacity = '0';
          tooltip.style.border = "1px solid #28a745";
          tooltip.style.transition = 'opacity 0.3s';
          tooltip.style.maxWidth = '600px';
          tooltip.style.wordBreak = 'break-word';
          document.body.appendChild(tooltip);
          checkMark.addEventListener('mouseover',function(event){
            //tooltip.textContent = 'This email has been checked and is likely safe. However, if you have any suspicions regarding its safety, please contact the IT department.';
            tooltip.textContent = data.grammarUrl;
            tooltip.style.top = ((event.clientY+10)+'px');
            tooltip.style.left = ((event.clientX+10) + 'px');
            tooltip.style.opacity = '1';
          });
          checkMark.addEventListener('mouseout',function(){
            tooltip.style.opacity = '0';
          })
        }
      })
  // Print extracted information
  //console.log(`title: ${title}`);
  console.log(`Sender: ${sender}`);
  //console.log(`Email body: ${emailBody}`);
  console.log("Hyperlinks:");
  hyperlinks.forEach((link) => console.log(`${link.text}: ${link.url}`));
  console.log(`Attachments: ${JSON.stringify(attachments)}`);
}

// Run the extraction function when the extension is executed
//extractEmailData();
setTimeout(extractEmailData,2500)

