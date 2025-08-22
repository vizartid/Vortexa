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
// Removed localStorage import

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
  // Removed localStorage functionality

  // Mock data for sidebar conversations (replace with actual data fetching if needed)
  // This mock data will be enhanced by localStorage later.
  const conversations = [
    { id: "conv-1", title: "Conversation 1", lastMessage: "Hello there!" },
    { id: "conv-2", title: "Conversation 2", lastMessage: "How can I help you?" },
  ];
  const activeConversationId = currentConversationId; // This should be managed by your state

  // Welcome message for users
  useEffect(() => {
    toast({
      title: "Selamat datang di Vortexa!",
      description: "Silakan mulai percakapan dengan AI assistant",
      duration: 3000,
    });
  }, []);

  // Fetch conversations
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return await response.json();
    },
  });


  const messagesQuery = useQuery({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    queryFn: async () => {
      if (!currentConversationId) {
        return [];
      }

      const response = await fetch(`/api/conversations/${currentConversationId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched messages:', data);
      return data?.messages || [];
    },
    enabled: !!currentConversationId,
    retry: 2,
    staleTime: 1000,
  });

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
      
      // Prepare JSON payload instead of FormData for Netlify Functions
      const payload = {
        message,
        userId: 'default-user',
        conversationId,
        attachments
      };

      try {
        const response = await apiRequest('POST', '/api/chat', payload);

        console.log('API Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          let errorMessage = 'Failed to send message';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('API Response data:', data);
        return data;
      } catch (error) {
        console.error('Network/API Error:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('Message sent successfully:', data);
      
      // Set conversation ID immediately
      setCurrentConversationId(data.conversationId);
      setIsTyping(false);

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", data.conversationId, "messages"]
      });
      
      // Show success message
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
      return apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", currentConversationId, "messages"]
      });
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
    if (currentConversationId) {
      clearConversationMutation.mutate(currentConversationId);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(undefined);
    setIsSidebarOpen(false); // Close sidebar on new conversation
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setIsSidebarOpen(false); // Close sidebar on selection
  };

  const handleDeleteConversation = (conversationId: string) => {
    // Implement delete conversation logic here if needed
    console.log("Deleting conversation:", conversationId);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData, isTyping]);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Burger Menu di kanan atas */}
      {isMobile && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <div className="flex h-full w-full">
        {/* Sidebar */}
        <div className={`
          ${isMobile ? (
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          ) : (
            isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          ${isMobile ? 'fixed' : 'relative'}
          inset-y-0 left-0
          ${isDesktopSidebarOpen && !isMobile ? 'w-80' : 'w-80'}
          bg-slate-800/50
          backdrop-blur-sm
          border-r border-slate-700
          transition-all duration-300 ease-in-out
          ${isMobile ? 'z-40' : 'z-10'}
        `}>
          <ChatSidebar
            currentConversationId={currentConversationId}
            onConversationSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
            // Use server conversations or empty array
            conversations={conversationsData?.conversations || []}
            isLoadingConversations={isLoadingConversations}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
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
                  disabled={clearConversationMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messagesData && messagesData.length > 0 ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messagesData.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
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
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                placeholder="Ketik pesan Anda..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}