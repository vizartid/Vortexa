
// Helper function for CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Helper function to create JSON response with CORS
function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event, context) => {
  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, {
      error: 'Method not allowed',
      message: `${event.httpMethod} method is not supported. Use GET instead.`,
    });
  }

  try {
    // Return available models
    const models = [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Google\'s fast and efficient multimodal AI model optimized for speed and performance',
        isPrimary: true
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        description: 'Anthropic\'s fast and lightweight AI model, great for quick responses',
        isPrimary: false
      }
    ];

    return jsonResponse(200, {
      success: true,
      models: models,
      total: models.length
    });

  } catch (error) {
    console.error('Models function error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      success: false
    });
  }
};
