const processButton = document.getElementById('processBtn');
const textInput = document.getElementById('textInput');
const resultOutput = document.getElementById('resultOutput')


processButton.addEventListener('click', async () => {
    //Everything here happens when button is clicked

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
                "content": "You are Promptly AI. Your job is to take raw text or screenshots and convert them into a neat bulleted list. Read the text provided by the student, extract all assignments, quizzes, and tasks along with their exact due dates/times. Don't say anything to the user just respond with the bulleted list."

              },
              {
                "role": "user",
                "content" : userText
              }
            ]
          })
      })
    

    const data = await response.json();
    
    const aiResult = data.choices[0].message.content;

    resultOutput.innerHTML = `
            <div style="margin-top: 20px; text-align: left; width: 350px; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #d2d2d7;">
                <h3 style="margin-top: 0; color: #1d1d1f; font-size: 18px; margin-bottom: 12px;"> Due Dates Found:</h3>
                <div style="color: #333; line-height: 1.6; white-space: pre-line; font-size: 15px;">
                    ${aiResult}
                </div>
            </div>
        `;

    
  } catch (error){
    console.error("Error connecting to Open Router: ", error);
    resultOutput.innerHTML = `<p style="color: #ff3b30; margin-top: 15px;"> Connection lost. Please check your connection.</p>`;
  } finally {
   processButton.disabled = false;
  }
  });