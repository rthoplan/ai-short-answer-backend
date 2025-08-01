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

**Instructions:**
1. Compare the student's answer to the model answer.
2. Score the student's answer on a scale of 0 to 2:
   - 2 points: Fully correct
   - 1 point: Partially correct
   - 0 points: Incorrect
3. Provide brief feedback.

**Question:** "${question}"
**Model Answer:** "${modelAnswer}"
**Student's Answer:** "${studentAnswer}"

Please respond in JSON format: { "score": number, "feedback": string }`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    score: { type: "NUMBER" },
                    feedback: { type: "STRING" }
                },
                required: ["score", "feedback"]
            }
        }
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const jsonText = result.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(jsonText);
        res.json(parsed);

    } catch (err) {
        console.error(err);
        res.status(500).json({ score: 0, feedback: "Internal error. Try again later." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
