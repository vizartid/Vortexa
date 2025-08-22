import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { conversations, messages, insertConversationSchema, insertMessageSchema, type Conversation, type Message } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Please set up Neon database in Replit.");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export const storage = {
  async createConversation(data: typeof insertConversationSchema._type): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(data).returning();
    return conversation;
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  },

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return conversation;
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  },

  async deleteConversation(id: string): Promise<boolean> {
    // Delete messages first
    await db.delete(messages).where(eq(messages.conversationId, id));

    // Delete conversation
    const result = await db.delete(conversations).where(eq(conversations.id, id));
    return result.rowCount > 0;
  },

  async createMessage(data: typeof insertMessageSchema._type): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  },

  async deleteMessages(conversationId: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.conversationId, conversationId));
    return result.rowCount > 0;
  },
};