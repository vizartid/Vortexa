
import Anthropic from '@anthropic-ai/sdk';
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

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn("ANTHROPIC_API_KEY is not set. Claude functionality will be disabled.");
}

const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

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
  if (!anthropic) {
    throw new Error("Claude API is not configured. Please set ANTHROPIC_API_KEY.");
  }

  try {
    const claudeMessages = convertMessagesToClaudeFormat(request.messages);
    
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
      messages: claudeMessages as any,
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleanedText = cleanMarkdownFormatting(rawText);

    // Estimate token usage
    const promptTokens = request.messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
    const completionTokens = Math.ceil(cleanedText.length / 4);

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
