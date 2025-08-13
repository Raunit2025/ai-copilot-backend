
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();

const port = 3001;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = 'AIzaSyAF1zmbFKwUwYve2UedJdyxILRGjdk_43w';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const extractJson = (text) => {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
  if (jsonMatch) {
    return jsonMatch[1] || jsonMatch[0];
  }
  return null;
};


app.get('/', (req, res) => {
    res.send("AI Copilot Backend is running!");
});


app.post('/api/generate-quiz', async (req, res) => {
    try {
        const { articleText } = req.body;
        if (!articleText) {
            return res.status(400).json({ error: 'Article text is required.' });
        }
        
        const prompt = `
            Based on the article text below, generate a 3-question multiple-choice quiz.
            Your response MUST be ONLY a single, valid, minified JSON object string.
            Do NOT include any markdown like \`\`\`json, comments, or any other text.
            The JSON object must be structured exactly like this: {"quiz":[{"question":"...","options":["..."],"correctAnswer":"..."}]}.

            Article Text:
            ---
            ${articleText}
            ---
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawResponse = response.text();

        const jsonString = extractJson(rawResponse);
        if (!jsonString) {
          console.error("Raw AI response for quiz:", rawResponse);
          throw new Error("No valid JSON for quiz found in the AI response.");
        }

        res.json(JSON.parse(jsonString));

    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ error: 'Failed to generate quiz.' });
    }
});


app.post('/api/capture-lead', async (req, res) => {
    try {
        const { email, score, totalQuestions } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        console.log(`Lead Captured: ${email}, Score: ${score}/${totalQuestions}`);

        const emailPrompt = `
            Generate content for a follow-up email for a user who scored ${score} out of ${totalQuestions} on a quiz about System Design.
            Your response MUST be ONLY a single, valid, minified JSON object string.
            Do NOT include any markdown like \`\`\`json, comments, or any other text.
            The JSON object must be structured exactly like this: {"subject":"...","body":"..."}.
            The body should use \\n for new lines.
            - If the score is high, congratulate the user and suggest they might be ready for an advanced masterclass.
            - If the score is low, encourage them and provide a link to a foundational System Design article to help them improve.
            - In either case, include a link to 'https://www.scaler.com/topics/system-design/' and a call-to-action for 'https://www.scaler.com/events/system-design-masterclass/'.
        `;

        const result = await model.generateContent(emailPrompt);
        const response = await result.response;
        const rawResponse = response.text();

        const jsonString = extractJson(rawResponse);
        if (!jsonString) {
          console.error("Raw AI response for email:", rawResponse);
          throw new Error("No valid JSON for email found in the AI response.");
        }
        
        const emailContent = JSON.parse(jsonString);

        console.log('--- GENERATED EMAIL ---');
        console.log(`To: ${email}`);
        console.log(`Subject: ${emailContent.subject}`);
        console.log(`Body:\n${emailContent.body}`);
        console.log('-----------------------');

        res.json({ success: true, message: 'Lead captured and email generated.' });

    } catch (error) {
        console.error('Error capturing lead:', error);
        res.status(500).json({ error: 'Failed to capture lead.' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});