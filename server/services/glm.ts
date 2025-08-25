
import { Message } from "@shared/schema";

// Function to clean markdown formatting from AI responses
function cleanMarkdownFormatting(text: string): string {
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

const apiKey = process.env.GLM_API_KEY;

if (!apiKey) {
  console.warn("GLM_API_KEY is not set. GLM functionality will be disabled.");
}

export interface ChatCompletionRequest {
  messages: Message[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

function convertMessagesToGLMFormat(messages: Message[]) {
  const glmMessages = [];
  
  for (const message of messages) {
    if (message.role === 'user' || message.role === 'assistant') {
      glmMessages.push({
        role: message.role,
        content: message.content
      });
    }
  }
  
  return glmMessages;
}

export async function createGLMChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  if (!apiKey) {
    throw new Error("GLM API is not configured. Please set GLM_API_KEY.");
  }

  try {
    const glmMessages = convertMessagesToGLMFormat(request.messages);
    
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "glm-4.5-flash",
        messages: glmMessages,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GLM API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from GLM API');
    }

    const rawText = data.choices[0].message.content;
    const cleanedText = cleanMarkdownFormatting(rawText);

    return {
      content: cleanedText,
      usage: {
        prompt_tokens: data.usage?.prompt_tokens || Math.ceil(request.messages.reduce((sum, msg) => sum + msg.content.length, 0) / 4),
        completion_tokens: data.usage?.completion_tokens || Math.ceil(cleanedText.length / 4),
        total_tokens: data.usage?.total_tokens || Math.ceil((request.messages.reduce((sum, msg) => sum + msg.content.length, 0) + cleanedText.length) / 4),
      },
      model: "glm-4.5-flash",
    };
  } catch (error) {
    console.error("GLM API Error:", error);
    throw new Error(`GLM API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
