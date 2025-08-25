import { Message, FileAttachment } from "@shared/schema";
import { Bot, User, Copy, Check, Image, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Logo-vortexa-white.png?url";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleDownloadAttachment = (attachment: FileAttachment) => {
    const byteCharacters = atob(attachment.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: attachment.mimeType });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const attachments = message.attachments as FileAttachment[] | null;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex items-start max-w-3xl", isUser ? "flex-row-reverse space-x-reverse space-x-3" : "space-x-3")}>
        <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          {isUser ? (
            <User className="w-4 h-4 text-primary" />
          ) : (
            <img
              src={logoImage}
              alt="Vortexa AI"
              className="w-6 h-6 object-contain"
            />
          )}
        </div>
        
        <div
          className={cn(
            "px-4 py-3 rounded-xl relative group",
            isUser 
              ? "message-user rounded-tr-md" 
              : "message-assistant rounded-tl-md"
          )}
          data-testid={`message-${message.role}-${message.id}`}
        >
          {/* File Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-3 p-2 bg-background/10 rounded-lg"
                >
                  {attachment.mimeType.startsWith('image/') ? (
                    <div className="flex items-center space-x-3">
                      <Image className="w-5 h-5 text-accent" />
                      <img
                        src={`data:${attachment.mimeType};base64,${attachment.data}`}
                        alt={attachment.filename}
                        className="max-w-48 max-h-32 rounded object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.filename}</p>
                        <p className="text-xs opacity-70">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDownloadAttachment(attachment)}
                    data-testid={`button-download-${attachment.id}`}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {message.content && (
            <div className="prose max-w-none text-inherit">
              <p className="whitespace-pre-wrap break-words text-base leading-relaxed font-roboto">{message.content}</p>
            </div>
          )}
          
          {!isUser && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={handleCopy}
              data-testid="button-copy-message"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          )}
          
          {message.metadata && typeof message.metadata === 'object' && message.metadata !== null && (() => {
            const meta = message.metadata as any;
            return (
              <div className="mt-2 text-xs opacity-70">
                <div className="flex items-center space-x-2">
                  {meta.tokens && (
                    <span>{meta.tokens} tokens</span>
                  )}
                  {meta.cost && (
                    <span>• ${meta.cost.toFixed(4)}</span>
                  )}
                  {meta.model && (
                    <span>• {meta.model}</span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
