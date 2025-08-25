import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, Image, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileAttachment } from "@shared/schema";

interface ChatInputProps {
  onSendMessage: (message: string, attachments: FileAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Ketik pesan Anda...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
    }
  }, [message]);

  // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
  useEffect(() => {
    setEstimatedTokens(Math.ceil(message.length / 4));
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    
    if ((trimmedMessage || attachments.length > 0) && !disabled) {
      console.log('Submitting message:', { message: trimmedMessage, attachments: attachments.length });
      try {
        onSendMessage(trimmedMessage, attachments);
        setMessage("");
        setAttachments([]);
      } catch (error) {
        console.error('Error submitting message:', error);
      }
    } else {
      console.log('Message not submitted:', { 
        hasMessage: !!trimmedMessage, 
        hasAttachments: attachments.length > 0, 
        disabled 
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File ${file.name} terlalu besar. Maksimum 10MB.`);
        continue;
      }

      try {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

            const attachment: FileAttachment = {
              id: `${Date.now()}-${Math.random()}`,
              filename: file.name,
              mimeType: file.type,
              size: file.size,
              data: base64Data,
              uploadedAt: new Date(),
            };

            setAttachments(prev => [...prev, attachment]);
          } catch (error) {
            console.error('Error processing file:', file.name, error);
          }
        };
        
        reader.onerror = () => {
          console.error('Error reading file:', file.name);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error setting up file reader for:', file.name, error);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-background">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
            >
              {getFileIcon(attachment.mimeType)}
              <span className="truncate max-w-[200px]">{attachment.filename}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(attachment.id)}
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[50px] max-h-32 resize-none pr-12"
            rows={1}
          />

          {/* File attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <Button
          type="submit"
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          size="sm"
          className="h-10 w-10 p-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Token count */}
      {estimatedTokens > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Estimasi: {estimatedTokens} token
        </div>
      )}
    </form>
  );
}