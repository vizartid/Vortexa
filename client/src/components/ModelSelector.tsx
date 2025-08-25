
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bot } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  className?: string;
}

const models = [
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Google's fast model",
    isPrimary: true
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "Anthropic's efficient model",
    isPrimary: false
  },
  {
    id: "glm-4-flash",
    name: "GLM-4.5 Flash",
    description: "Zhipu AI model",
    isPrimary: false
  }
];

export function ModelSelector({ selectedModel = "gemini-1.5-flash", onModelChange, className = "" }: ModelSelectorProps) {
  const handleModelChange = (value: string) => {
    if (onModelChange) {
      onModelChange(value);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Bot className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <Select value={selectedModel} onValueChange={handleModelChange}>
        <SelectTrigger className="w-[220px] min-w-[220px]">
          <SelectValue placeholder="Select AI Model" className="truncate" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col w-full">
                <span className="font-medium text-sm truncate">
                  {model.name} {model.isPrimary && "(Primary)"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {model.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
