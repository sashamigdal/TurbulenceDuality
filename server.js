const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Function to fetch and extract text from an arXiv HTML page
const fetchArxivText = async (url) => {
    try {
        console.log(`🔍 Fetching content from: ${url}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        return $('body').text().replace(/\s+/g, ' ').trim();
    } catch (error) {
        console.error(`❌ Error fetching arXiv page (${url}): ${error.message}`);
        return "No relevant data found.";
    }
};

// List of arXiv papers with correct titles
const arxivLinks = [
    { title: "Quantum Solution of Classical Turbulence: Decaying Energy Spectrum", url: "https://arxiv.org/html/2312.15470v12" },
    { title: "Fluid Dynamics Duality and Solution of Decaying Turbulence", url: "https://arxiv.org/html/2411.01389v4" }
];

// Function to find the most relevant paper for a question
const retrieveRelevantArxivContent = async (question) => {
    for (const paper of arxivLinks) {
        if (question.toLowerCase().includes("turbulence") || question.toLowerCase().includes("euler ensemble")) {
            return await fetchArxivText(paper.url);
        }
    }
    return "No relevant data found.";
};

// API endpoint for user questions
app.post('/question', async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    // Retrieve relevant arXiv content
    const retrievedContent = await retrieveRelevantArxivContent(question);

    try {
        const response = await axios.post(
            'https://api.deepinfra.com/v1/openai/chat/completions',
            {
                model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
                messages: [
                    { role: "system", content: "You are an AI expert in turbulence theory. Use only scientific reasoning." },
                    { role: "user", content: `Context: ${retrievedContent} \n\n Question: ${question}` }
                ],
                max_tokens: 500
            },
            {
                headers: { 
                    'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content.trim();
        res.json({ answer: aiResponse });
    } catch (error) {
        console.error("❌ API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to generate a response from DeepSeek API." });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
