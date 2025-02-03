const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Load the API key from an environment variable
const apiKey = process.env.API_KEY;

// Proxy endpoint
app.get('/api', async (req, res) => {
    try {
        const response = await axios.get('https://api.example.com/data', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
