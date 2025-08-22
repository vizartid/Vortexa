
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Bot, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Model {
  id: string;
  name: string;
  description: string;
  isPrimary?: boolean;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: modelsData, isLoading } = useQuery({
    queryKey: ["/api/models"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/models');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const models = modelsData?.models || [];
  const currentModel = models.find((model: Model) => model.id === selectedModel);

  // Set default model to primary model (Gemini) if not already selected
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      const primaryModel = models.find((model: Model) => model.isPrimary);
      if (primaryModel) {
        onModelChange(primaryModel.id);
      }
    }
  }, [models, selectedModel, onModelChange]);

  const getModelIcon = (modelId: string) => {
    if (modelId.includes('claude')) {
      return <Sparkles className="w-4 h-4" />;
    }
    return <Bot className="w-4 h-4" />;
  };

  const getModelDisplayName = (model: Model) => {
    if (model.id === 'gemini-1.5-flash') return 'Gemini Flash';
    if (model.id === 'claude-3-haiku') return 'Claude Haiku';
    return model.name;
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Bot className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="min-w-[140px] justify-between bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80"
        >
          <div className="flex items-center gap-2">
            {currentModel && getModelIcon(currentModel.id)}
            <span className="font-medium">
              {currentModel ? getModelDisplayName(currentModel) : 'Select Model'}
            </span>
            {currentModel?.isPrimary && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Primary
              </Badge>
            )}
          </div>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {models.map((model: Model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => {
              onModelChange(model.id);
              setIsOpen(false);
            }}
            className="flex flex-col items-start p-3 cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              {getModelIcon(model.id)}
              <span className="font-medium">{getModelDisplayName(model)}</span>
              {model.isPrimary && (
                <Badge variant="secondary" className="text-xs px-1 py-0 ml-auto">
                  Primary
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {model.description}
            </p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
