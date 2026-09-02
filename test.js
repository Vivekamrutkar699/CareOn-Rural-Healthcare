const https = require('https');

require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Available models:');
      response.models.forEach(model => console.log(model.name));
    } catch (err) {
      console.error('Error parsing response:', err);
      console.log('Raw data:', data);
    }
  });

}).on('error', err => console.error('Request error:', err));
