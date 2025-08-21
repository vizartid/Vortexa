
const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running on Netlify' });
});

// Chat endpoint - simplified for static deployment
app.post('/api/chat', (req, res) => {
  res.status(503).json({ 
    error: 'Chat functionality requires backend server',
    message: 'This is a static deployment. Full chat functionality requires the Express server.',
    suggestion: 'Run the development server locally for full functionality'
  });
});

// Conversations endpoint
app.get('/api/conversations', (req, res) => {
  res.json([]);
});

app.post('/api/conversations', (req, res) => {
  res.status(503).json({ 
    error: 'Database functionality not available',
    message: 'This is a static deployment. Database operations require the Express server.'
  });
});

// Messages endpoint
app.get('/api/conversations/:id/messages', (req, res) => {
  res.json([]);
});

// User data endpoint
app.get('/api/user', (req, res) => {
  res.json({ name: 'Demo User', email: 'demo@example.com' });
});

// Catch-all for other API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `API endpoint ${req.path} not implemented in static deployment`,
    availableEndpoints: ['/api/health', '/api/chat', '/api/conversations', '/api/user']
  });
});

module.exports.handler = serverless(app);
