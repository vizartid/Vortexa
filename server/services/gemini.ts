
import { GoogleGenerativeAI } from "@google/generative-ai";
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

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error("GOOGLE_API_KEY is required. Please set it in your environment variables or Replit Secrets.");
}

const genAI = new GoogleGenerativeAI(apiKey);

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

function convertMessagesToGeminiFormat(messages: Message[]) {
  const history = [];
  
  // Build conversation history for context
  for (let i = 0; i < messages.length - 1; i++) {
    const message = messages[i];
    if (message.role === 'user') {
      history.push({
        role: "user",
        parts: [{ text: message.content }],
      });
    } else if (message.role === 'assistant') {
      history.push({
        role: "model", 
        parts: [{ text: message.content }],
      });
    }
  }
  
  // Get the latest user message
  const latestMessage = messages[messages.length - 1];
  const latestUserMessage = latestMessage?.role === 'user' ? latestMessage.content : "";
  
  return { history, latestMessage: latestUserMessage };
}

export async function createGeminiChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 1000,
      }
    });

    const { history, latestMessage } = convertMessagesToGeminiFormat(request.messages);
    
    let result;
    if (history.length > 0) {
      // Use chat with history for context
      const chat = model.startChat({
        history: history,
      });
      result = await chat.sendMessage(latestMessage);
    } else {
      // Use simple generation for first message
      result = await model.generateContent(latestMessage);
    }
    
    const response = await result.response;
    const rawText = response.text();
    
    // Clean markdown formatting from the response
    const cleanedText = cleanMarkdownFormatting(rawText);

    // Estimate token usage (rough approximation)
    const promptTokens = Math.ceil(latestMessage.length / 4);
    const completionTokens = Math.ceil(cleanedText.length / 4);

    return {
      content: cleanedText,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
      model: "gemini-1.5-flash",
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Gemini API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
