
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

    // Check for required API keys based on model
    let response, data, rawText, modelName;
    
    switch (model) {
      case 'claude-3-haiku':
        const claudeApiKey = process.env.ANTHROPIC_API_KEY;
        if (!claudeApiKey) {
          return jsonResponse(500, {
            error: 'Claude API key not configured',
            message: 'ANTHROPIC_API_KEY tidak ditemukan di environment variables Netlify'
          });
        }
        
        try {
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
          
          if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
          }
          
          data = await response.json();
          rawText = data.content[0].text;
          modelName = 'claude-3-haiku-20240307';
        } catch (error) {
          console.error('Claude API failed, falling back to Gemini:', error);
          // Fallback to Gemini
          return await callGeminiAPI(message);
        }
        break;
        
      case 'glm-4-flash':
        const glmApiKey = process.env.GLM_API_KEY;
        if (!glmApiKey) {
          return jsonResponse(500, {
            error: 'GLM API key not configured',
            message: 'GLM_API_KEY tidak ditemukan di environment variables Netlify'
          });
        }
        
        try {
          response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${glmApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'glm-4-flash',
              messages: [{ role: 'user', content: message.trim() }],
              max_tokens: 1000,
              temperature: 0.7
            })
          });
          
          if (!response.ok) {
            throw new Error(`GLM API error: ${response.status}`);
          }
          
          data = await response.json();
          rawText = data.choices[0].message.content;
          modelName = 'glm-4-flash';
        } catch (error) {
          console.error('GLM API failed, falling back to Gemini:', error);
          // Fallback to Gemini
          return await callGeminiAPI(message);
        }
        break;
        
      case 'gemini-1.5-flash':
      default:
        return await callGeminiAPI(message);
    }
    
    async function callGeminiAPI(messageText) {
      const apiKey = process.env.GOOGLE_API_KEY;
      console.log('API Key check:', apiKey ? 'Found' : 'Not found');
      
      if (!apiKey) {
        console.error('GOOGLE_API_KEY not found in environment');
        return jsonResponse(500, {
          error: 'Gemini API key not configured',
          message: 'GOOGLE_API_KEY tidak ditemukan di environment variables Netlify'
        });
      }

    // Call Gemini API with better error handling
      let response;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      try {
        console.log('Calling Gemini API with URL:', geminiUrl);
        
        response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: messageText.trim() }]
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
          success: false
        });
      }

      console.log('Gemini API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API Error:', response.status, errorData);
        return jsonResponse(500, {
          error: 'Gemini API failed',
          message: `HTTP ${response.status}: ${response.statusText}`,
          success: false
        });
      }

      let data;
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

      const rawText = data.candidates[0].content.parts[0].text;
      modelName = 'gemini-1.5-flash';
      return processResponse(rawText, modelName, messageText);
    }
    
    function processResponse(rawText, modelName, originalMessage) {

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
      const promptTokens = Math.ceil(originalMessage.length / 4);
      const completionTokens = Math.ceil(cleanedText.length / 4);

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
          content: originalMessage.trim(),
          timestamp: new Date().toISOString()
        },
        assistantMessage: {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: cleanedText,
          timestamp: new Date().toISOString(),
          metadata: {
            model: modelName,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens
          }
        }
      });
    }
    
    // Process the response for non-Gemini models
    return processResponse(rawText, modelName, message);

  } catch (error) {
    console.error('Chat function error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      success: false
    });
  }
}
