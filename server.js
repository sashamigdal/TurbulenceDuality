const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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
    process.exit(1);
}

// Load preprocessed knowledge base
const knowledgeBasePath = path.join(__dirname, 'knowledge_base.json');
let knowledgeBase = [];
if (fs.existsSync(knowledgeBasePath)) {
    knowledgeBase = JSON.parse(fs.readFileSync(knowledgeBasePath, 'utf-8'));
} else {
    console.error("⚠️ Knowledge base file not found. AI will work without custom knowledge.");
}

// Function to retrieve relevant knowledge snippets
function retrieveRelevantKnowledge(question) {
    const lowerCaseQuestion = question.toLowerCase();
    return knowledgeBase
        .filter(entry => entry.text.toLowerCase().includes(lowerCaseQuestion))
        .map(entry => entry.text)
        .slice(0, 3) // Limit to 3 relevant snippets to avoid overloading the response
        .join("\n\n");
}

// AI Response Endpoint
app.post('/question', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "❌ Question is required." });
    }

    console.log(`🟢 Received question: "${question}"`);

    // Retrieve relevant knowledge from stored research
    const relevantKnowledge = retrieveRelevantKnowledge(question);

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    { 
                        role: "system", 
                        content: "You are an expert in turbulence theory, particularly the Euler Ensemble. Use the provided research materials to formulate precise answers. If no relevant material is found, answer based on general physics knowledge." 
                    },
                    { role: "user", content: `Context from research: ${relevantKnowledge}\n\nUser question: ${question}` }
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

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
