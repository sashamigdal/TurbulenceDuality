const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Fix: Allow requests from your GitHub Pages site
app.use(cors({
    origin: "https://turbulenceduality.github.io", // ⬅️ Your actual GitHub Pages URL
    methods: ["POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Load OpenAI API key
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("❌ OpenAI API key is missing. Set API_KEY in Render environment variables.");
    process.exit(1);
}

// Debug route
app.get('/debug', (req, res) => {
    res.json({ message: "✅ Debugging: Server is running correctly." });
});

// AI Response Endpoint
app.post('/question', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "❌ Question is required." });
    }

    console.log(`🟢 Received question: "${question}"`);

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are an AI answering questions about turbulence theory." },
                    { role: "user", content: question }
                ],
                max_tokens: 400
            },
            {
                headers: { 
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content.trim();
        console.log(`🟢 AI Response: "${aiResponse}"`);

        res.json({ answer: aiResponse });
    } catch (error) {
        console.error("❌ OpenAI API Error:", error.response?.data || error.message);
        res.status(500).json({ error: `⚠️ Failed to generate a response. Details: ${error.message}` });
    }
});

// Catch-All 404 Route
app.use((req, res) => {
    res.status(404).json({ error: "❌ Route not found. Use POST /question" });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
