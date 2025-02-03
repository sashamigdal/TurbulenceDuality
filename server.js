const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow requests from the frontend
app.use(cors());
app.use(express.json());

// Load the OpenAI API key from environment variables
const apiKey = process.env.API_KEY;

// Proxy endpoint for OpenAI API
app.post('/ask', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Question is required." });
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are an AI assistant answering questions about turbulence theory." },
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

        res.json({ answer: response.data.choices[0].message.content.trim() });
    } catch (error) {
        console.error("Error fetching OpenAI response:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate a response. Please try again later." });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
