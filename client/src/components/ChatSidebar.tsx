
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, MessageSquare, Trash2, Edit3, Menu, Bot } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Logo-vortexa-white.png?url";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  conversations?: Conversation[];
  isLoadingConversations?: boolean;
}

export function ChatSidebar({ 
  currentConversationId, 
  onConversationSelect, 
  onNewConversation,
  conversations = [],
  isLoadingConversations = false 
}: ChatSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("DELETE", `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Conversation deleted",
        description: "The conversation has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    deleteConversationMutation.mutate(conversationId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const SidebarContent = () => (
    <div className="flex h-screen flex-col bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={logoImage}
            alt="Vortexa Logo"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          <h1 className="text-lg font-bold text-white truncate">Vortexa Chat</h1>
        </div>
        <Button
          onClick={() => {
            onNewConversation();
            if (isMobile) setSidebarOpen(false);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
          data-testid="button-new-conversation"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">New Conversation</span>
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2 min-h-full">
            {isLoadingConversations ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    onConversationSelect(conversation.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={cn(
                    "group p-3 hover:bg-slate-800/70 rounded-lg cursor-pointer transition-all duration-200 border border-slate-700/30 min-h-[60px] flex flex-col justify-center",
                    currentConversationId === conversation.id && "bg-slate-700/70 border-blue-500/50"
                  )}
                  data-testid={`conversation-item-${conversation.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate leading-5">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {formatTimestamp(conversation.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                        onClick={(e) => handleDeleteConversation(e, conversation.id)}
                        data-testid={`button-delete-${conversation.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center min-h-[calc(100vh-120px)] text-slate-400 px-2">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium mb-2">No conversations yet</p>
                  <p className="text-xs opacity-80 leading-relaxed">Start a new conversation to get started</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" data-testid="button-mobile-menu" className="fixed top-4 right-4 z-50 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80 max-w-[85vw]">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-80 h-screen border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
      <SidebarContent />
    </div>
  );
}
