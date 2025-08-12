const express = require('express');
const cors = require('cors');
const {GoogleGenerativeAI} = require('@google/generative-ai');
const app = express();

const port = 3001;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = 'AIzaSyAF1zmbFKwUwYve2UedJdyxILRGjdk_43w';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.get('/',(req,res) => {
    res.send("Ai Copilot is running in Backend!");
});

app.post('/api/get-quize', async(req, res) =>{
    try{
        const { articleText } = req.body;
        if(!articleText){
            return res.status(400).json({error:'Article text is required.'});
        }
        const prompt = `
      Based on the following article text, generate a 3-question multiple-choice quiz to test a user's comprehension.
      Each question should have 4 options, and you must indicate the correct answer.
      Return the output in a clean JSON format like this:
      {
        "quiz": [
          {
            "question": "Your question here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The correct option text"
          }
        ]
      }

      Here is the article text:
      ---
      ${articleText}
      ---
    `;

    const result = await model.generateContent(prompt);
    const response  = await result.response;
    const jsonResponse = response.text().replace('```json\n','').replace('\n```','');
    
    res.json(JSON.parse(jsonResponse));

    }
    catch(error){
        console.error('Error generating quize:',error);
        res.status(500).json({error: 'Failed to generate quize.'});
    }
});

app.post('/api/capture-lead', async (req, res) => {
    try {
        const { email, quizResults, articleText } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        // 1. Store the lead (e.g., in a database or even a Google Sheet for a prototype)
        console.log(`Lead Captured: ${email}`);
        console.log('Quiz Results:', quizResults);

        // 2. Use AI to generate a personalized follow-up email
        const emailPrompt = `
            A user with the email "${email}" just completed a quiz about an article on System Design.
            Their quiz results are: ${JSON.stringify(quizResults)}.

            Write a friendly and encouraging email to this user.
            1.  Thank them for taking the quiz.
            2.  Briefly comment on their performance (e.g., "Great job!" or "You're on the right track!").
            3.  Provide a link to a (mock) free resource: 'https://scaler.com/system-design-cheatsheet'.
            4.  Include a compelling call-to-action to sign up for our "System Design Masterclass" at 'https://scaler.com/system-design-masterclass'.

            Keep the email concise and engaging.
        `;
        
        const result = await model.generateContent(emailPrompt);
        const response = await result.response;
        const emailBody = response.text();

        // 3. Send the email (for a prototype, you can just log it)
        console.log('--- Generated Email ---');
        console.log(emailBody);
        
        res.json({ success: true, message: 'Lead captured and email sent (simulated).' });

    } catch (error) {
        console.error('Error capturing lead:', error);
        res.status(500).json({ error: 'Failed to capture lead.' });
    }
});

app.listen(port,() =>{
    console.log(`Server is Runnig on PORT: ${port}`);
});

//AIzaSyAF1zmbFKwUwYve2UedJdyxILRGjdk_43w