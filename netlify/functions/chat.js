
export async function handler(event, context) {
  // Handle CORS for all requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  // Handle GET request for testing
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Chat function is working!',
        status: 'ok',
        method: 'GET',
        supportedMethods: ['POST'],
        timestamp: new Date().toISOString()
      }),
    };
  }

  // Only allow POST requests for chat functionality
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        message: `${event.httpMethod} method is not supported. Use POST instead.`,
        allowedMethods: ['POST', 'GET', 'OPTIONS']
      }),
    };
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        }),
      };
    }

    const { message, conversationId, userId, attachments } = requestBody;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Message is required',
          message: 'Please provide a non-empty message'
        }),
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

    // Call Gemini API with better error handling
    let response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: message.trim() }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });
    } catch (fetchError) {
      console.error('Network error calling Gemini API:', fetchError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Network error',
          message: 'Failed to connect to Gemini API',
          success: false
        }),
      };
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', response.status, errorData);

      let errorMessage = 'Unknown error from Gemini API';
      try {
        const parsedError = JSON.parse(errorData);
        errorMessage = parsedError.error?.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Gemini API failed',
          message: errorMessage,
          success: false
        }),
      };
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse Gemini response as JSON:', jsonError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Invalid response format',
          message: 'Gemini API returned invalid JSON',
          success: false
        }),
      };
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response structure:', data);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Invalid response from Gemini API',
          message: 'No content received from AI',
          success: false
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

    // Generate conversation ID for this session (don't persist to database)
    const currentConversationId = conversationId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Return simple response without database operations
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Chat response generated successfully",
        conversationId: currentConversationId,
        response: cleanedText,
        userMessage: {
          role: 'user',
          content: message.trim(),
          timestamp: new Date().toISOString()
        },
        assistantMessage: {
          role: 'assistant',
          content: cleanedText,
          timestamp: new Date().toISOString(),
          metadata: {
            model: 'gemini-1.5-flash',
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens
          }
        }
      }),
    };

  } catch (error) {
    console.error('Chat function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
        success: false
      }),
    };
  }
}
