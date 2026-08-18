const processButton = document.getElementById('processBtn');
const textInput = document.getElementById('textInput');
const resultOutput = document.getElementById('resultOutput')

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
console.log("API Key loaded:", import.meta.env.VITE_OPENROUTER_API_KEY);

processButton.addEventListener('click', async () => {
    const userText = textInput.value.trim();

    if (!userText){
        resultOutput.innerHTML = `<p style="color: #ff3b30; margin-top: 15px; font-weight: 500;"> Paste some assignment text first please!!!!!!</p>`
        return
    }

    resultOutput.innerHTML = `<p style="color: #86868b; margin-top: 15px;"> Analyzing due dates...</p>`;
    processButton.disabled = true;
    
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json", 
            "HTTP-Referer": "http://localhost:1420",
            "X-Title": "Promptly App"
          },
          body: JSON.stringify({
            "model":"google/gemma-4-26b-a4b-it:free",
            "messages": [
              {
                "role": "system",
                "content": "You are Promptly AI. Your job is to take raw text or screenshots and convert them into a json. You are a precise data extractor. Extract assignments and exact due dates. You MUST output ONLY a valid JSON array of objects. Format: [{\"task\": \"Name\", \"due\": \"Original text due date\", \"reminder_time\": \"YYYY-MM-DDTHH:MM:SS\"}]. Estimate the year as 2026 if not provided. Read the text provided by the student, extract all assignments, quizzes, and tasks along with their exact due dates/times."
              },
              {
                "role": "user",
                "content" : userText
              }
            ]
          })
      })
    
      const data = await response.json();
      let rawContent = data.choices[0].message.content;

      const start = rawContent.indexOf('[');
      const end = rawContent.lastIndexOf(']') + 1;
      
      if (start === -1 || end === 0 ){
          throw new Error ("No JSON array found in response");
      }

      const jsonString = rawContent.substring(start, end);
      const assignmentsList = JSON.parse(jsonString);

      let checklistHTML = `<div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">`;

      assignmentsList.forEach((item) => {
          checklistHTML += `
            <label style = "display: flex; align-items: flex-start; gap: 12px; cursor: pointer;">
            <input type="checkbox" style="margin-top: 4px; transform: scale(1.2);"
                onclick="this.nextElementSibling.style.textDecoration = this.checked ? 'line-through' : 'none' ;">
            <div>
            <strong contenteditable="true" style="display: block; font-size: 15px; outline: none; padding: 2px; border-radius: 4px; transition: background 0.2s;" onfocus="this.style.background='#e5e5ea'" onblur="this.style.background='transparent'">${item.task}</strong>
            <span contenteditable="true" style="font-size: 13px; color: #86868b; outline: none; padding: 2px; border-radius: 4px; transition: background 0.2s;" onfocus="this.style.background='#e5e5ea'" onblur="this.style.background='transparent'">Due: ${item.due}</span>
            </div>
          </label>
          `;
      });

      checklistHTML += `</div>`;

      resultOutput.innerHTML = `
      <div style="margin-top: 20px; text-align: left; width: 350px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #d2d2d7;">
          <h3 style="margin-top: 0; color: #1d1d1f; font-size: 18px; margin-bottom: 5px;">Your Reminders</h3>
          ${checklistHTML}
      </div>
  `;

      // Safe global Tauri v2 notification trigger
      if (window.__TAURI__ && window.__TAURI__.notification) {
          console.log("Tauri notification module found.");

          let permissionGranted = await window.__TAURI__.notification.isPermissionGranted();
          console.log("Initial permission status:", permissionGranted);

          if (!permissionGranted) {
              const permission = await window.__TAURI__.notification.requestPermission();
              console.log("Requested permission result:", permission);
              permissionGranted = permission === 'granted';
          }

          if (permissionGranted) {
            setTimeout(() => {
                window.__TAURI__.notification.sendNotification({
                  title: 'Promptly',
                  body: 'Your reminders have been generated successfully!',
                  sound: 'default'
              });
              console.log("Notification sent!");
            }, 3000);
          } else {
            console.warn("Notification permission was denied.");
          }
      } else {
        console.error("window.__TAURI__.notification is undefined. Ensure withGlobalTauri is true and the Rust plugin is loaded.");
      }
    
  } catch (error){
    console.error("Error connecting to Open Router: ", error);
    resultOutput.innerHTML = `<p style="color: #ff3b30; margin-top: 15px;"> Connection lost. Please check your connection.</p>`;
  } finally {
   processButton.disabled = false;
  }
});