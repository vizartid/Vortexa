import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, FileAttachment } from "@shared/schema";
import { z } from "zod";
import multer from "multer";

// Simple token estimation function
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const sendMessageSchema = z.object({
    conversationId: z.string().optional(),
    message: z.string().min(1),
    userId: z.string().optional().nullable(),
    attachments: z.array(z.object({
      filename: z.string(),
      mimeType: z.string(),
      data: z.string(), // base64 encoded
      size: z.number(),
    })).optional(),
  });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Get available models
  app.get("/api/models", async (req, res) => {
    try {
      const models = [
        {
          id: "gemini-1.5-flash",
          name: "Google Gemini 1.5 Flash",
          description: "Fast and efficient model untuk chat dan text generation"
        }
      ];
      res.json({ models });
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ message: "Failed to fetch models" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const attachment: FileAttachment = {
        id: `${Date.now()}`,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer.toString('base64'),
        uploadedAt: new Date(),
      };

      res.json({ attachment });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get conversations for user
  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = req.query.userId as string || null;
      const conversations = await storage.getConversations(userId);
      res.json({ conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getMessages(id);
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const { title, userId = null } = req.body;

      const validatedData = insertConversationSchema.parse({
        title: title || "New Conversation",
        userId,
      });

      const conversation = await storage.createConversation(validatedData);
      res.json({ conversation });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Send message with Gemini AI
  app.post("/api/chat", upload.array('files', 5), async (req, res) => {
    try {
      // Parse form data and files
      const validatedData = sendMessageSchema.parse(req.body);
      const { conversationId, message, userId } = validatedData;
      const files = req.files as Express.Multer.File[];

      let currentConversationId = conversationId;

      // Create new conversation if none provided
      if (!currentConversationId) {
        const conversation = await storage.createConversation({
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          userId: userId || null, // Use null for anonymous users
        });
        currentConversationId = conversation.id;
      }

      // Process file attachments
      const attachments: FileAttachment[] = files ? files.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer.toString('base64'),
        uploadedAt: new Date(),
      })) : [];

      // Save user message with attachments
      const userMessage = await storage.createMessage({
        conversationId: currentConversationId,
        role: "user",
        content: message,
        attachments: attachments.length > 0 ? attachments : null,
        metadata: {
          tokens: estimateTokens(message),
        },
      });

      // Get conversation history for context
      const messages = await storage.getMessages(currentConversationId);

      // Import Gemini service
      const { createGeminiChatCompletion } = await import("./services/gemini");

      // Generate AI response using Gemini
      const aiResponse = await createGeminiChatCompletion({
        messages: messages,
        model: "gemini-1.5-flash",
        maxTokens: 1000,
        temperature: 0.7,
      });

      // Save AI response
      const assistantMessage = await storage.createMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: aiResponse.content,
        attachments: null,
        metadata: {
          tokens: aiResponse.usage.completion_tokens,
          model: aiResponse.model,
          prompt_tokens: aiResponse.usage.prompt_tokens,
          completion_tokens: aiResponse.usage.completion_tokens,
        },
      });

      // Update conversation timestamp
      await storage.updateConversation(currentConversationId, {
        updatedAt: new Date(),
      });

      res.json({
        conversationId: currentConversationId,
        userMessage,
        assistantMessage,
      });

    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process chat message" 
      });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteConversation(id);

      if (!deleted) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Clear conversation messages
  app.delete("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMessages(id);
      res.json({ message: "Conversation cleared successfully" });
    } catch (error) {
      console.error("Error clearing conversation:", error);
      res.status(500).json({ message: "Failed to clear conversation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}