import { Bot } from "lucide-react";
import logoImage from "@assets/Logo-vortexa-white.png?url";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-3 max-w-3xl">
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
          <img
            src={logoImage}
            alt="Vortexa AI"
            className="w-5 h-5 object-contain"
          />
        </div>
        <div className="bg-chat-bubble p-4 rounded-xl rounded-tl-md" data-testid="typing-indicator">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
              <div 
                className="w-2 h-2 bg-accent rounded-full animate-bounce" 
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div 
                className="w-2 h-2 bg-accent rounded-full animate-bounce" 
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span className="text-sm text-muted-foreground">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
