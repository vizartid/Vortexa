import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { conversations, messages, insertConversationSchema, insertMessageSchema, type Conversation, type Message } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

let db: any = null;
let useDatabase = false;

// Initialize database connection if available
if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
    useDatabase = true;
    console.log("✅ Connected to Neon database");
  } catch (error) {
    console.warn("⚠️ Database connection failed, using memory storage:", error);
    useDatabase = false;
  }
} else {
  console.warn("⚠️ DATABASE_URL not found, using memory storage. Set DATABASE_URL in Replit Secrets for persistence.");
}

// Memory storage fallback
const memoryStorage = {
  conversations: new Map<string, Conversation>(),
  messages: new Map<string, Message>()
};

export const storage = {
  async createConversation(data: typeof insertConversationSchema._type): Promise<Conversation> {
    if (useDatabase && db) {
      const [conversation] = await db.insert(conversations).values(data).returning();
      return conversation;
    } else {
      // Memory storage fallback
      const id = randomUUID();
      const now = new Date();
      const conversation: Conversation = {
        id,
        userId: data.userId || null,
        title: data.title,
        createdAt: now,
        updatedAt: now,
      };
      memoryStorage.conversations.set(id, conversation);
      return conversation;
    }
  },

  async getConversations(userId: string): Promise<Conversation[]> {
    if (useDatabase && db) {
      return await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt));
    } else {
      // Memory storage fallback
      return Array.from(memoryStorage.conversations.values())
        .filter(conv => conv.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  },

  async getConversation(id: string): Promise<Conversation | undefined> {
    if (useDatabase && db) {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);
      return conversation;
    } else {
      // Memory storage fallback
      return memoryStorage.conversations.get(id);
    }
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    if (useDatabase && db) {
      const [updated] = await db
        .update(conversations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning();
      return updated;
    } else {
      // Memory storage fallback
      const conversation = memoryStorage.conversations.get(id);
      if (!conversation) return undefined;
      
      const updated: Conversation = {
        ...conversation,
        ...updates,
        updatedAt: new Date(),
      };
      memoryStorage.conversations.set(id, updated);
      return updated;
    }
  },

  async deleteConversation(id: string): Promise<boolean> {
    if (useDatabase && db) {
      // Delete messages first
      await db.delete(messages).where(eq(messages.conversationId, id));
      // Delete conversation
      const result = await db.delete(conversations).where(eq(conversations.id, id));
      return result.rowCount > 0;
    } else {
      // Memory storage fallback
      const deleted = memoryStorage.conversations.delete(id);
      if (deleted) {
        // Also delete messages
        Array.from(memoryStorage.messages.entries())
          .filter(([_, msg]) => msg.conversationId === id)
          .forEach(([msgId]) => memoryStorage.messages.delete(msgId));
      }
      return deleted;
    }
  },

  async createMessage(data: typeof insertMessageSchema._type): Promise<Message> {
    if (useDatabase && db) {
      const [message] = await db.insert(messages).values(data).returning();
      return message;
    } else {
      // Memory storage fallback
      const id = randomUUID();
      const message: Message = {
        id,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        attachments: data.attachments || null,
        metadata: data.metadata || null,
        createdAt: new Date(),
      };
      memoryStorage.messages.set(id, message);
      return message;
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    if (useDatabase && db) {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
    } else {
      // Memory storage fallback
      return Array.from(memoryStorage.messages.values())
        .filter(msg => msg.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  },

  async deleteMessages(conversationId: string): Promise<boolean> {
    if (useDatabase && db) {
      const result = await db.delete(messages).where(eq(messages.conversationId, conversationId));
      return result.rowCount > 0;
    } else {
      // Memory storage fallback
      const messagesToDelete = Array.from(memoryStorage.messages.entries())
        .filter(([_, msg]) => msg.conversationId === conversationId);
      
      messagesToDelete.forEach(([id]) => {
        memoryStorage.messages.delete(id);
      });
      
      return messagesToDelete.length > 0;
    }
  },
};