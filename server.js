const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS to allow frontend requests only from GitHub Pages
app.use(cors({
    origin: "https://turbulenceduality.github.io", // ✅ Replace with your actual GitHub Pages URL
    methods: ["POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

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

// Function to retrieve relevant research excerpts with more structured context
function retrieveRelevantKnowledge(question) {
    const lowerCaseQuestion = question.toLowerCase();
    let relevantSections = knowledgeBase.filter(entry => 
        entry.text.toLowerCase().includes(lowerCaseQuestion) ||
        lowerCaseQuestion.includes(entry.text.toLowerCase().split(" ").slice(0, 5).join(" "))
    );

    if (relevantSections.length === 0) {
        return "I couldn't find relevant research for this topic.";
    }

    return relevantSections.map(entry => `**Source:** ${entry.file}\n**Excerpt:** ${entry.text}`).slice(0, 5).join("\n\n---\n\n");
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
                model: "ft:gpt-4o-2024-08-06:migdal-research::Ax365GPy",
                messages: [
                    { 
                        role: "system", 
                        content: "You are an expert in turbulence theory, particularly the Euler Ensemble. Answer ONLY using the provided research excerpts. If no relevant research is found, say 'I don't know.' Do not rely on general turbulence knowledge." 
                    },
                    { role: "user", content: `Here is the relevant research on this topic:\n\n${relevantKnowledge}\n\nUser question: ${question}` }
                ],
                max_tokens: 500
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
