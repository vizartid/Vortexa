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
}

export function ChatSidebar({ currentConversationId, onConversationSelect, onNewConversation }: ChatSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["/api/conversations"],
    select: (data: any) => data.conversations as Conversation[],
  });

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
    <div className="flex h-full flex-col bg-slate-900/95 backdrop-blur-sm rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={logoImage}
            alt="Vortexa Logo"
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-lg font-bold text-white">Vortexa Chat</h1>
        </div>
        <Button
          onClick={() => {
            onNewConversation();
            if (isMobile) setSidebarOpen(false);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg"
          data-testid="button-new-conversation"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversationsData && conversationsData.length > 0 ? (
            conversationsData.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  onConversationSelect(conversation.id);
                  if (isMobile) setSidebarOpen(false);
                }}
                className={cn(
                  "p-3 hover:bg-slate-800/70 rounded-lg cursor-pointer group transition-all duration-200 border border-slate-700/30",
                  currentConversationId === conversation.id && "bg-slate-700/70 border-blue-500/50"
                )}
                data-testid={`conversation-item-${conversation.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTimestamp(conversation.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
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
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs opacity-80 mt-1">Start a new conversation to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>

      
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="hidden lg:flex lg:w-80 border-r border-border">
      <SidebarContent />
    </div>
  );
}