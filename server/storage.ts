
import { type Conversation, type Message, insertConversationSchema, insertMessageSchema } from '@shared/schema';
import { randomUUID } from 'crypto';

// Memory storage only
const memoryStorage = {
  conversations: new Map<string, Conversation>(),
  messages: new Map<string, Message>()
};

export const storage = {
  async createConversation(data: typeof insertConversationSchema._type): Promise<Conversation> {
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
  },

  async getConversations(userId: string | null): Promise<Conversation[]> {
    return Array.from(memoryStorage.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getConversation(id: string): Promise<Conversation | undefined> {
    return memoryStorage.conversations.get(id);
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = memoryStorage.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated: Conversation = {
      ...conversation,
      ...updates,
      updatedAt: new Date(),
    };
    memoryStorage.conversations.set(id, updated);
    return updated;
  },

  async deleteConversation(id: string): Promise<boolean> {
    const deleted = memoryStorage.conversations.delete(id);
    if (deleted) {
      // Also delete messages
      Array.from(memoryStorage.messages.entries())
        .filter(([_, msg]) => msg.conversationId === id)
        .forEach(([msgId]) => memoryStorage.messages.delete(msgId));
    }
    return deleted;
  },

  async createMessage(data: typeof insertMessageSchema._type): Promise<Message> {
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
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(memoryStorage.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async deleteMessages(conversationId: string): Promise<boolean> {
    const messagesToDelete = Array.from(memoryStorage.messages.entries())
      .filter(([_, msg]) => msg.conversationId === conversationId);
    
    messagesToDelete.forEach(([id]) => {
      memoryStorage.messages.delete(id);
    });
    
    return messagesToDelete.length > 0;
  },
};
