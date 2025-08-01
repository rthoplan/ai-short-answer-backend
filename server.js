require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/grade', async (req, res) => {
    const { question, studentAnswer, modelAnswer } = req.body;

    const prompt = `You are an expert Teaching Assistant for a 'Foundations of Data Handling' university course. Your task is to grade a student's short-answer response based on a model answer from the lecture.

Instructions:
1. Compare the student's answer to the model answer.
2. Score the student's answer on a scale of 0 to 2:
   - 2 points: Fully correct
   - 1 point: Partially correct
   - 0 points: Incorrect
3. Provide brief feedback.

Question: "${question}"
Model Answer: "${modelAnswer}"
Student's Answer: "${studentAnswer}"

Respond only in JSON: { "score": number, "feedback": string }`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    const GEMINI_MODEL = "models/gemini-1.5-flash";
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!raw) {
            console.error('Malformed response from Gemini:', JSON.stringify(result, null, 2));
            return res.status(500).json({ score: 0, feedback: 'Malformed AI response. Try again later.' });
        }

        // Remove ```json and ``` if present
        const cleanText = raw.replace(/^\s*```json\s*|\s*```$/g, '');

        const parsed = JSON.parse(cleanText);

        res.json({
            score: Math.round(parsed.score),
            feedback: parsed.feedback
        });

    } catch (err) {
        console.error('Error in /api/grade:', err);
        res.status(500).json({ score: 0, feedback: 'Internal server error. Try again later.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
