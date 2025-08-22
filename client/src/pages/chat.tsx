
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bot, Trash2, ArrowLeft, Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Message, FileAttachment } from "@shared/schema";
import { Navigation } from "@/components/Navigation";
import logoImage from "@assets/Logo-vortexa-white.png?url";

export default function Chat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();

  // Mock conversations data (database disabled)
  const conversationsData = { conversations: [] };
  const isLoadingConversations = false;

  // Welcome message for users
  useEffect(() => {
    toast({
      title: "Selamat datang di Vortexa!",
      description: "Silakan mulai percakapan dengan AI assistant",
      duration: 3000,
    });
  }, []);

  const messagesQuery = useQuery({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    queryFn: async () => {
      // Return empty array for now, messages will be added via onSuccess
      return [];
    },
    enabled: !!currentConversationId,
    retry: false,
    staleTime: Infinity,
  });

  // For serverless mode, we'll manage messages in local state
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Dummy query to maintain the same interface
  const messagesData = messagesQuery.data as Message[] || [];
  const isLoading = messagesQuery.isLoading;

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      message,
      attachments,
      conversationId
    }: {
      message: string;
      attachments: FileAttachment[];
      conversationId?: string;
    }) => {
      console.log('Sending message:', { message, conversationId, attachmentsCount: attachments.length });

      // Prepare JSON payload
      const payload = {
        message: message.trim(),
        userId: 'default-user',
        conversationId,
        attachments
      };

      try {
        const response = await apiRequest('POST', '/api/chat', payload);
        console.log('API Response status:', response.status);

        // Clone response for multiple reads
        const responseClone = response.clone();

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: Failed to send message`;
          
          try {
            const errorText = await responseClone.text();
            console.error('Error response text:', errorText);
            
            // Try to parse as JSON first
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              // If not JSON, use text content
              errorMessage = errorText || errorMessage;
            }
          } catch (textError) {
            console.error('Could not read error response:', textError);
          }
          
          throw new Error(errorMessage);
        }

        // Get response text first
        let responseText;
        try {
          responseText = await response.text();
          console.log('Raw response:', responseText.substring(0, 200) + '...');
        } catch (textError) {
          console.error('Could not read response text:', textError);
          throw new Error('Could not read server response');
        }

        // Validate response is not empty
        if (!responseText || responseText.trim() === '') {
          throw new Error('Server returned empty response');
        }

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Response text:', responseText);
          
          // Check if response looks like HTML (common error response)
          if (responseText.trim().startsWith('<')) {
            throw new Error('Server returned HTML instead of JSON. Please check server logs.');
          }
          
          throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
        }

        console.log('Parsed API Response:', data);
        
        // Validate response structure
        if (data.success === false) {
          throw new Error(data.message || data.error || 'Server returned error response');
        }
        
        // Handle different response formats gracefully
        if (data.success && data.response) {
          // Netlify Function response format
          return {
            success: true,
            conversationId: data.conversationId,
            response: data.response,
            assistantMessage: data.assistantMessage
          };
        } else if (data.assistantMessage) {
          // Express server response format
          return data;
        } else if (data.content || data.message) {
          // Alternative response formats
          return {
            success: true,
            conversationId: data.conversationId || conversationId,
            response: data.content || data.message,
            assistantMessage: {
              content: data.content || data.message
            }
          };
        }
        
        return data;
      } catch (error) {
        console.error('Send message error:', error);
        
        // Provide more helpful error messages
        if (error instanceof Error) {
          if (error.message.includes('fetch')) {
            throw new Error('Network error: Could not connect to server');
          } else if (error.message.includes('JSON')) {
            throw new Error('Server response format error. Please try again.');
          }
          throw error;
        }
        
        throw new Error('Unknown error occurred while sending message');
      }
    },
    onSuccess: (data, variables) => {
      console.log('Message sent successfully:', data);

      const conversationId = data.conversationId || currentConversationId || `conv-${Date.now()}`;
      setCurrentConversationId(conversationId);

      // Handle both Netlify Function and Express server response formats
      const assistantContent = data.response || data.assistantMessage?.content || 'No response received';
      const assistantMetadata = data.assistantMessage?.metadata || null;

      // Add messages to local state instead of database
      const newMessages = [
        {
          id: `user-${Date.now()}`,
          conversationId: conversationId,
          role: 'user' as const,
          content: variables.message,
          attachments: null,
          metadata: null,
          createdAt: new Date().toISOString()
        },
        {
          id: `assistant-${Date.now()}`,
          conversationId: conversationId,
          role: 'assistant' as const,
          content: assistantContent,
          attachments: null,
          metadata: assistantMetadata,
          createdAt: new Date().toISOString()
        }
      ];

        // Update query cache with new messages
      queryClient.setQueryData(
        ["/api/conversations", conversationId, "messages"],
        (oldData: any) => [...(oldData || []), ...newMessages]
      );

      setIsTyping(false);

      toast({
        title: "Pesan Terkirim",
        description: "Pesan Anda berhasil dikirim",
        duration: 2000,
      });
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast({
        title: "Gagal Mengirim Pesan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim pesan",
        variant: "destructive",
      });
      setIsTyping(false); // Ensure typing indicator is turned off on error
    },
  });

  const clearConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // In serverless mode, clearing conversation means resetting local messages
      setLocalMessages([]);
      // Optionally, you could call a new serverless function to clear history if needed
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Conversation cleared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear conversation",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async (message: string, attachments: FileAttachment[]) => {
    if (!message.trim() && attachments.length === 0) return;

    setIsTyping(true);
    sendMessageMutation.mutate({
      message,
      attachments,
      conversationId: currentConversationId,
    });
  };

  const handleClearConversation = () => {
    // Clear local messages
    setLocalMessages([]);
    // If you want to clear history on the server, you'd need a dedicated serverless function for it.
    // For now, we just clear the local state.
    setCurrentConversationId(undefined); // Reset conversation context
  };

  // Simplified conversation creation for serverless mode
  const createConversation = () => {
    const newId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCurrentConversationId(newId);
    setLocalMessages([]);
  };

  const handleNewConversation = () => {
    createConversation();
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setIsSidebarOpen(false); // Close sidebar on selection
    // In serverless mode, you might want to load previous messages if you store them locally
    // For this example, we'll assume a fresh start for selected conversations or no history load
    setLocalMessages([]);
  };

  const handleDeleteConversation = (conversationId: string) => {
    // Implement delete conversation logic here if needed (e.g., from local storage)
    console.log("Deleting conversation:", conversationId);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData, isTyping]);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - positioned absolute to allow chat to expand behind it */}
      {!isMobile && (
        <div className={`
          ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 w-80
          transition-all duration-300 ease-in-out
          z-10
        `}>
          <ChatSidebar
            currentConversationId={currentConversationId}
            onConversationSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
            conversations={conversationsData?.conversations || []}
            isLoadingConversations={isLoadingConversations}
          />
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <ChatSidebar
          currentConversationId={currentConversationId}
          onConversationSelect={handleSelectConversation}
          onNewConversation={handleNewConversation}
          conversations={conversationsData?.conversations || []}
          isLoadingConversations={isLoadingConversations}
        />
      )}

      {/* Main chat area - takes full width, with padding when sidebar is open */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        !isMobile && isDesktopSidebarOpen ? 'ml-80' : 'ml-0'
      }`}>
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Desktop Sidebar Toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="mr-2"
              >
                {isDesktopSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img
              src={logoImage}
              alt="Vortexa Logo"
              className="w-6 h-6 object-contain"
            />
            <div>
              <h1 className="font-semibold text-foreground">Vortexa Chat</h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Assistant
              </p>
            </div>
          </div>

          {currentConversationId && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearConversation}
                disabled={sendMessageMutation.isPending} // Disable if a message is being sent
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className={`mx-auto w-full transition-all duration-300 ${
            !isMobile 
              ? 'max-w-none px-4' 
              : 'max-w-4xl'
          }`}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messagesData && messagesData.length > 0 ? (
              <div className="space-y-4">
                {messagesData.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-md mx-auto">
                  <img
                    src={logoImage}
                    alt="Vortexa Logo"
                    className="w-16 h-16 mx-auto mb-6 opacity-80"
                  />
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">Selamat Datang!</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Mulai percakapan dengan mengirim pesan di bawah
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
          <div className={`mx-auto w-full transition-all duration-300 ${
            !isMobile 
              ? 'max-w-none px-4' 
              : 'max-w-4xl'
          }`}>
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              placeholder="Ketik pesan Anda..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
