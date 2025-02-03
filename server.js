const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow frontend requests
app.use(cors());
app.use(express.json());

// Load OpenAI API key from environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("❌ OpenAI API key is missing. Set API_KEY in Render environment variables.");
    process.exit(1); // Stop the server if the API key is missing
}

// Test route to check if server is running
app.get('/', (req, res) => {
    res.send("✅ Server is running! Use POST /ask to send questions.");
});

// AI Response Endpoint
app.post('/ask', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "❌ Question is required." });
    }

    console.log(`🟢 Received question: "${question}"`); // Log the incoming question

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4", // Change model if needed
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
        console.log(`🟢 AI Response: "${aiResponse}"`); // Log AI response

        res.json({ answer: aiResponse });
    } catch (error) {
        console.error("❌ OpenAI API Error:", error.response?.data || error.message);
        res.status(500).json({ error: `⚠️ Failed to generate a response. Details: ${error.message}` });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
