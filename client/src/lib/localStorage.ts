
// Utility functions for localStorage operations
export interface UserData {
  userId: string;
  username?: string;
  visitCount: number;
  lastVisit: string;
  preferences?: {
    theme?: string;
    language?: string;
  };
}

export interface ChatHistory {
  conversationId: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

class LocalStorageManager {
  private static instance: LocalStorageManager;
  private readonly USER_DATA_KEY = 'vortexa_user_data';
  private readonly CHAT_HISTORY_KEY = 'vortexa_chat_history';
  private readonly MESSAGES_KEY_PREFIX = 'vortexa_messages_';

  public static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // Generate unique user ID
  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // User Data Management
  public getUserData(): UserData {
    try {
      const data = localStorage.getItem(this.USER_DATA_KEY);
      if (data) {
        const userData = JSON.parse(data);
        // Update visit count and last visit
        userData.visitCount = (userData.visitCount || 0) + 1;
        userData.lastVisit = new Date().toISOString();
        this.setUserData(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error reading user data from localStorage:', error);
    }

    // Create new user data if doesn't exist
    const newUserData: UserData = {
      userId: this.generateUserId(),
      visitCount: 1,
      lastVisit: new Date().toISOString(),
      preferences: {
        theme: 'light',
        language: 'id'
      }
    };
    this.setUserData(newUserData);
    return newUserData;
  }

  public setUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data to localStorage:', error);
    }
  }

  public updateUserPreferences(preferences: Partial<UserData['preferences']>): void {
    const userData = this.getUserData();
    userData.preferences = { ...userData.preferences, ...preferences };
    this.setUserData(userData);
  }

  // Chat History Management
  public getChatHistory(): ChatHistory[] {
    try {
      const data = localStorage.getItem(this.CHAT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading chat history from localStorage:', error);
      return [];
    }
  }

  public addChatToHistory(chat: ChatHistory): void {
    try {
      const history = this.getChatHistory();
      const existingIndex = history.findIndex(c => c.conversationId === chat.conversationId);
      
      if (existingIndex >= 0) {
        history[existingIndex] = chat;
      } else {
        history.unshift(chat);
      }

      // Keep only last 50 chats
      if (history.length > 50) {
        history.splice(50);
      }

      localStorage.setItem(this.CHAT_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving chat history to localStorage:', error);
    }
  }

  public removeChatFromHistory(conversationId: string): void {
    try {
      const history = this.getChatHistory().filter(c => c.conversationId !== conversationId);
      localStorage.setItem(this.CHAT_HISTORY_KEY, JSON.stringify(history));
      // Also remove messages for this conversation
      this.removeMessagesFromStorage(conversationId);
    } catch (error) {
      console.error('Error removing chat from history:', error);
    }
  }

  // Messages Management
  public getMessagesForConversation(conversationId: string): any[] {
    try {
      const data = localStorage.getItem(this.MESSAGES_KEY_PREFIX + conversationId);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading messages from localStorage:', error);
      return [];
    }
  }

  public saveMessagesForConversation(conversationId: string, messages: any[]): void {
    try {
      localStorage.setItem(this.MESSAGES_KEY_PREFIX + conversationId, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }

  public removeMessagesFromStorage(conversationId: string): void {
    try {
      localStorage.removeItem(this.MESSAGES_KEY_PREFIX + conversationId);
    } catch (error) {
      console.error('Error removing messages from localStorage:', error);
    }
  }

  // Utility methods
  public clearAllData(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('vortexa_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  public getStorageInfo(): { totalSize: number; itemCount: number } {
    try {
      let totalSize = 0;
      let itemCount = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('vortexa_')) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
            itemCount++;
          }
        }
      });

      return { totalSize, itemCount };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { totalSize: 0, itemCount: 0 };
    }
  }
}

export const localStorageManager = LocalStorageManager.getInstance();

// Helper hooks for React components
export const useLocalStorage = () => {
  return {
    getUserData: () => localStorageManager.getUserData(),
    setUserData: (data: UserData) => localStorageManager.setUserData(data),
    updatePreferences: (prefs: Partial<UserData['preferences']>) => 
      localStorageManager.updateUserPreferences(prefs),
    getChatHistory: () => localStorageManager.getChatHistory(),
    addChatToHistory: (chat: ChatHistory) => localStorageManager.addChatToHistory(chat),
    removeChatFromHistory: (id: string) => localStorageManager.removeChatFromHistory(id),
    getMessages: (id: string) => localStorageManager.getMessagesForConversation(id),
    saveMessages: (id: string, messages: any[]) => 
      localStorageManager.saveMessagesForConversation(id, messages),
    clearAll: () => localStorageManager.clearAllData(),
    getStorageInfo: () => localStorageManager.getStorageInfo()
  };
};
