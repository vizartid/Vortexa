
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

// Function to clean markdown formatting from AI responses
function cleanMarkdownFormatting(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```/g, '').trim();
    })
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running on Netlify' });
});

// Chat endpoint with Gemini AI integration
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Please set GOOGLE_API_KEY in Netlify environment variables'
      });
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: message }] 
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return res.status(500).json({ 
        error: 'Gemini API failed',
        details: errorData.error?.message || 'Unknown error'
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ 
        error: 'Invalid response from Gemini API'
      });
    }

    const rawText = data.candidates[0].content.parts[0].text;
    const cleanedText = cleanMarkdownFormatting(rawText);

    // Estimate token usage (rough approximation)
    const promptTokens = Math.ceil(message.length / 4);
    const completionTokens = Math.ceil(cleanedText.length / 4);

    // Use provided conversationId or generate a new one
    const currentConversationId = conversationId || Date.now().toString();

    // Return response in the format expected by your frontend
    res.json({
      conversationId: currentConversationId,
      userMessage: {
        id: Date.now().toString() + '-user',
        conversationId: currentConversationId,
        role: 'user',
        content: message,
        attachments: null,
        metadata: { tokens: promptTokens },
        createdAt: new Date().toISOString()
      },
      assistantMessage: {
        id: Date.now().toString() + '-assistant',
        conversationId: currentConversationId,
        role: 'assistant',
        content: cleanedText,
        attachments: null,
        metadata: {
          tokens: completionTokens,
          model: 'gemini-1.5-flash',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens
        },
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Conversations endpoint - simplified for serverless
app.get('/api/conversations', (req, res) => {
  res.json({ conversations: [] });
});

app.post('/api/conversations', (req, res) => {
  const { title = 'New Conversation' } = req.body;
  
  // Generate a simple conversation for serverless mode
  const conversation = {
    id: Date.now().toString(),
    title,
    userId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.json({ conversation });
});

// Messages endpoint
app.get('/api/conversations/:id/messages', (req, res) => {
  res.json({ messages: [] });
});

// User data endpoint
app.get('/api/user', (req, res) => {
  res.json({ name: 'Demo User', email: 'demo@example.com' });
});

// Models endpoint
app.get('/api/models', (req, res) => {
  const models = [
    {
      id: "gemini-1.5-flash",
      name: "Google Gemini 1.5 Flash",
      description: "Fast and efficient model untuk chat dan text generation"
    }
  ];
  res.json({ models });
});

// Catch-all for other API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `API endpoint ${req.path} not implemented`,
    availableEndpoints: ['/api/health', '/api/chat', '/api/conversations', '/api/models', '/api/user']
  });
});

module.exports.handler = serverless(app);
