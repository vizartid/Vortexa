
export async function handler(event, context) {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message, conversationId, userId, attachments } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Gemini API key not configured',
          message: 'Please set GOOGLE_API_KEY in Netlify environment variables'
        }),
      };
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
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Gemini API failed',
          details: errorData.error?.message || 'Unknown error'
        }),
      };
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response from Gemini API'
        }),
      };
    }

    const rawText = data.candidates[0].content.parts[0].text;
    
    // Clean markdown formatting
    const cleanedText = rawText
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

    // Estimate token usage
    const promptTokens = Math.ceil(message.length / 4);
    const completionTokens = Math.ceil(cleanedText.length / 4);

    // Use provided conversationId or generate a new one
    const currentConversationId = conversationId || Date.now().toString();

    // Return response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
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
      }),
    };

  } catch (error) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }),
    };
  }
}
