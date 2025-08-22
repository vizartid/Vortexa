
import { Message } from "@shared/schema";

// Function to clean markdown formatting from AI responses
function cleanMarkdownFormatting(text: string): string {
  return text
    // Remove bold formatting (**text** or __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic formatting (*text* or _text_)
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, '$1')
    // Remove code blocks (```text```)
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```/g, '').trim();
    })
    // Remove inline code (`text`)
    .replace(/`(.*?)`/g, '$1')
    // Remove headers (# ## ### etc)
    .replace(/^#{1,6}\s+/gm, '')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

const apiKey = process.env.CLAUDE_API_KEY;

if (!apiKey) {
  console.warn("CLAUDE_API_KEY is not set. Claude functionality will be limited.");
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

function convertMessagesToClaudeFormat(messages: Message[]) {
  const claudeMessages = [];
  
  for (const message of messages) {
    if (message.role === 'user' || message.role === 'assistant') {
      claudeMessages.push({
        role: message.role,
        content: message.content
      });
    }
  }
  
  return claudeMessages;
}

export async function createClaudeChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY is required. Please set it in your environment variables or Replit Secrets.");
  }

  try {
    const claudeMessages = convertMessagesToClaudeFormat(request.messages);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        messages: claudeMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const rawText = data.content[0].text;
    
    // Clean markdown formatting from the response
    const cleanedText = cleanMarkdownFormatting(rawText);

    // Estimate token usage (rough approximation)
    const promptTokens = data.usage?.input_tokens || Math.ceil(claudeMessages.reduce((acc, msg) => acc + msg.content.length, 0) / 4);
    const completionTokens = data.usage?.output_tokens || Math.ceil(cleanedText.length / 4);

    return {
      content: cleanedText,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
      model: "claude-3-haiku-20240307",
    };
  } catch (error) {
    console.error("Claude API Error:", error);
    throw new Error(`Claude API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
