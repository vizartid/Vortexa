
import { z } from "zod";

// Type definitions without database tables
export interface User {
  id: string;
  username: string;
  password: string;
}

export interface Conversation {
  id: string;
  userId: string | null;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: string; // 'user' or 'assistant'
  content: string;
  attachments: FileAttachment[] | null;
  metadata: any | null;
  createdAt: Date;
}

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const insertConversationSchema = z.object({
  title: z.string(),
  userId: z.string().nullable(),
});

export const insertMessageSchema = z.object({
  conversationId: z.string(),
  role: z.string(),
  content: z.string(),
  attachments: z.array(z.any()).nullable(),
  metadata: z.any().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export interface FileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data: string; // base64 encoded
  uploadedAt: Date;
}
