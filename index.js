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

app.listen(port,() =>{
    console.log(`Server is Runnig on PORT: ${port}`);
});

//AIzaSyAF1zmbFKwUwYve2UedJdyxILRGjdk_43w