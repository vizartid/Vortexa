
// Utility functions for cookies operations
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

class CookiesManager {
  private static instance: CookiesManager;
  private readonly USER_DATA_KEY = 'vortexa_user_data';
  private readonly CHAT_HISTORY_KEY = 'vortexa_chat_history';
  private readonly MESSAGES_KEY_PREFIX = 'vortexa_messages_';

  public static getInstance(): CookiesManager {
    if (!CookiesManager.instance) {
      CookiesManager.instance = new CookiesManager();
    }
    return CookiesManager.instance;
  }

  // Cookie utility methods
  private setCookie(name: string, value: string, days: number = 365): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // Generate unique user ID
  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // User Data Management
  public getUserData(): UserData {
    try {
      const data = this.getCookie(this.USER_DATA_KEY);
      if (data) {
        const userData = JSON.parse(data);
        // Update visit count and last visit
        userData.visitCount = (userData.visitCount || 0) + 1;
        userData.lastVisit = new Date().toISOString();
        this.setUserData(userData);
        return userData;
      }
    } catch (error) {
      console.error('Error reading user data from cookies:', error);
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
      this.setCookie(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data to cookies:', error);
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
      const data = this.getCookie(this.CHAT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading chat history from cookies:', error);
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

      // Keep only last 20 chats (reduced to avoid cookie size limits)
      if (history.length > 20) {
        history.splice(20);
      }

      this.setCookie(this.CHAT_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving chat history to cookies:', error);
    }
  }

  public removeChatFromHistory(conversationId: string): void {
    try {
      const history = this.getChatHistory().filter(c => c.conversationId !== conversationId);
      this.setCookie(this.CHAT_HISTORY_KEY, JSON.stringify(history));
      // Also remove messages for this conversation
      this.removeMessagesFromStorage(conversationId);
    } catch (error) {
      console.error('Error removing chat from history:', error);
    }
  }

  // Messages Management (simplified for cookies)
  public getMessagesForConversation(conversationId: string): any[] {
    try {
      const data = this.getCookie(this.MESSAGES_KEY_PREFIX + conversationId);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading messages from cookies:', error);
      return [];
    }
  }

  public saveMessagesForConversation(conversationId: string, messages: any[]): void {
    try {
      // Only save last 10 messages per conversation to avoid cookie size limits
      const limitedMessages = messages.slice(-10);
      this.setCookie(this.MESSAGES_KEY_PREFIX + conversationId, JSON.stringify(limitedMessages));
    } catch (error) {
      console.error('Error saving messages to cookies:', error);
    }
  }

  public removeMessagesFromStorage(conversationId: string): void {
    try {
      this.deleteCookie(this.MESSAGES_KEY_PREFIX + conversationId);
    } catch (error) {
      console.error('Error removing messages from cookies:', error);
    }
  }

  // Utility methods
  public clearAllData(): void {
    try {
      // Get all cookies
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith('vortexa_')) {
          this.deleteCookie(name);
        }
      });
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  }

  public getStorageInfo(): { totalSize: number; itemCount: number } {
    try {
      let totalSize = 0;
      let itemCount = 0;
      const cookies = document.cookie.split(';');
      
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith('vortexa_')) {
          totalSize += cookie.length;
          itemCount++;
        }
      });

      return { totalSize, itemCount };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { totalSize: 0, itemCount: 0 };
    }
  }
}

export const cookiesManager = CookiesManager.getInstance();

// Helper hooks for React components (updated to use cookies)
export const useLocalStorage = () => {
  return {
    getUserData: () => cookiesManager.getUserData(),
    setUserData: (data: UserData) => cookiesManager.setUserData(data),
    updatePreferences: (prefs: Partial<UserData['preferences']>) => 
      cookiesManager.updateUserPreferences(prefs),
    getChatHistory: () => cookiesManager.getChatHistory(),
    addChatToHistory: (chat: ChatHistory) => cookiesManager.addChatToHistory(chat),
    removeChatFromHistory: (id: string) => cookiesManager.removeChatFromHistory(id),
    getMessages: (id: string) => cookiesManager.getMessagesForConversation(id),
    saveMessages: (id: string, messages: any[]) => 
      cookiesManager.saveMessagesForConversation(id, messages),
    clearAll: () => cookiesManager.clearAllData(),
    getStorageInfo: () => cookiesManager.getStorageInfo()
  };
};
