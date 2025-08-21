const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Basic API endpoint for Netlify Functions
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running on Netlify' });
});

// Handle all API routes
app.use('/api/*', (req, res) => {
  res.status(501).json({ 
    message: 'API endpoints not fully implemented for serverless deployment',
    note: 'This is a static frontend deployment. Backend functionality requires separate hosting.'
  });
});

module.exports.handler = serverless(app);