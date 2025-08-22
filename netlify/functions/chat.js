
export async function handler(event, context) {
  console.log('=== CHAT FUNCTION START ===');
  console.log('Event:', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    body: event.body ? event.body.substring(0, 200) : null,
    queryStringParameters: event.queryStringParameters
  });

  // Always ensure JSON response headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  };

  // Helper function to ensure JSON response
  function jsonResponse(statusCode, data) {
    return {
      statusCode,
      headers,
      body: JSON.stringify(data)
    };
  }

  // Clean markdown formatting function
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

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { message: 'CORS preflight successful' });
  }

  // Handle GET request for testing
  if (event.httpMethod === 'GET') {
    return jsonResponse(200, {
      message: 'Chat function is working!',
      status: 'ok',
      method: 'GET',
      supportedMethods: ['POST'],
      timestamp: new Date().toISOString()
    });
  }

  // Only allow POST requests for chat functionality
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      error: 'Method not allowed',
      message: `${event.httpMethod} method is not supported. Use POST instead.`,
      allowedMethods: ['POST', 'GET', 'OPTIONS']
    });
  }

  try {
    console.log('Chat function called with:', event.httpMethod, event.body);

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return jsonResponse(400, {
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      });
    }

    const { message, conversationId, userId, attachments, model = 'gemini-1.5-flash' } = requestBody;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return jsonResponse(400, {
        error: 'Message is required',
        message: 'Please provide a non-empty message'
      });
    }

    let response, data, rawText, cleanedText, promptTokens, completionTokens;
    
    if (model === 'claude-3-haiku') {
      // Handle Claude API
      const claudeApiKey = process.env.CLAUDE_API_KEY;
      console.log('Claude API Key check:', claudeApiKey ? 'Found' : 'Not found');
      
      if (!claudeApiKey) {
        console.error('CLAUDE_API_KEY not found in environment');
        return jsonResponse(500, {
          error: 'Claude API key not configured',
          message: 'CLAUDE_API_KEY tidak ditemukan di environment variables Netlify',
          debug: {
            envVarsFound: Object.keys(process.env).length,
            claudeVars: Object.keys(process.env).filter(key => key.includes('CLAUDE'))
          }
        });
      }

      try {
        console.log('Calling Claude API');
        
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            temperature: 0.7,
            messages: [{ role: 'user', content: message.trim() }]
          })
        });
      } catch (fetchError) {
        console.error('Network error calling Claude API:', fetchError);
        return jsonResponse(500, {
          error: 'Network error',
          message: 'Gagal terhubung ke Claude API',
          success: false,
          debug: {
            errorMessage: fetchError.message,
            errorStack: fetchError.stack
          }
        });
      }

      console.log('Claude API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Claude API Error:', response.status, errorData);

        let errorMessage = 'Unknown error from Claude API';
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error?.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        return jsonResponse(500, {
          error: 'Claude API failed',
          message: errorMessage,
          success: false
        });
      }

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse Claude response as JSON:', jsonError);
        return jsonResponse(500, {
          error: 'Invalid response format',
          message: 'Claude API returned invalid JSON',
          success: false
        });
      }

      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('Invalid Claude response structure:', data);
        return jsonResponse(500, {
          error: 'Invalid response from Claude API',
          message: 'No content received from AI',
          success: false
        });
      }

      rawText = data.content[0].text;
      cleanedText = cleanMarkdownFormatting(rawText);
      promptTokens = data.usage?.input_tokens || Math.ceil(message.length / 4);
      completionTokens = data.usage?.output_tokens || Math.ceil(cleanedText.length / 4);
      
    } else {
      // Handle Gemini API (default)
      const geminiApiKey = process.env.GOOGLE_API_KEY;
      console.log('Gemini API Key check:', geminiApiKey ? 'Found' : 'Not found');
      
      if (!geminiApiKey) {
        console.error('GOOGLE_API_KEY not found in environment');
        return jsonResponse(500, {
          error: 'Gemini API key not configured',
          message: 'GOOGLE_API_KEY tidak ditemukan di environment variables Netlify',
          debug: {
            envVarsFound: Object.keys(process.env).length,
            googleVars: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
          }
        });
      }

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      
      try {
        console.log('Calling Gemini API');
        
        response = await fetch(geminiUrl, {
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
        return jsonResponse(500, {
          error: 'Network error',
          message: 'Gagal terhubung ke Gemini API',
          success: false,
          debug: {
            errorMessage: fetchError.message,
            errorStack: fetchError.stack
          }
        });
      }

      console.log('Gemini API response status:', response.status, response.statusText);
      
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

        return jsonResponse(500, {
          error: 'Gemini API failed',
          message: errorMessage,
          success: false
        });
      }

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse Gemini response as JSON:', jsonError);
        return jsonResponse(500, {
          error: 'Invalid response format',
          message: 'Gemini API returned invalid JSON',
          success: false
        });
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini response structure:', data);
        return jsonResponse(500, {
          error: 'Invalid response from Gemini API',
          message: 'No content received from AI',
          success: false
        });
      }

      rawText = data.candidates[0].content.parts[0].text;
      cleanedText = cleanMarkdownFormatting(rawText);
      promptTokens = Math.ceil(message.length / 4);
      completionTokens = Math.ceil(cleanedText.length / 4);
    }

    // Generate conversation ID for this session
    const currentConversationId = conversationId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('Sending successful response');

    // Return response in the format expected by frontend
    return jsonResponse(200, {
      success: true,
      message: "Chat response generated successfully",
      conversationId: currentConversationId,
      response: cleanedText,
      userMessage: {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString()
      },
      assistantMessage: {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: cleanedText,
        timestamp: new Date().toISOString(),
        metadata: {
          model: model,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens
        }
      }
    });

  } catch (error) {
    console.error('Chat function error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      success: false
    });
  }
}
