const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load DeepInfra API Key from Render Environment Variables
const API_KEY = process.env.DEEPINFRA_API_KEY;

app.post('/question', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Question is required" });
    }

    console.log(`🟢 Received question: "${question}"`);

    try {
        const response = await axios.post(
            'https://api.deepinfra.com/v1/openai/chat/completions',
            {
                model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                messages: [
                    { role: "system", content: "You are an AI expert in turbulence theory. Use only scientific reasoning." },
                    { role: "user", content: question }
                ],
                max_tokens: 500
            },
            {
                headers: { 
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content.trim();
        console.log(`🟢 AI Response: "${aiResponse}"`);

        res.json({ answer: aiResponse });
    } catch (error) {
        console.error("❌ API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate a response from DeepSeek API." });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
