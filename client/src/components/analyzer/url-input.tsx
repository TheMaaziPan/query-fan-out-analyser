import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BatchUpload from "./batch-upload";

import TooltipHover from "@/components/ui/tooltip-hover";

interface UrlInputProps {
  onAnalysisStart: (analysisId: number) => void;
  onBatchStart: (batchId: string) => void;
  disabled?: boolean;
  variant?: 'sidebar' | 'mobile';
}

export default function UrlInput({ onAnalysisStart, onBatchStart, disabled, variant = 'sidebar' }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateUrl = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      const isValid = ['http:', 'https:'].includes(urlObj.protocol);
      setIsValidUrl(isValid);
      return isValid;
    } catch {
      setIsValidUrl(false);
      return false;
    }
  };

  const startAnalysisMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/analyze", { url });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Started",
        description: "Your URL is being analysed. This may take a few minutes.",
      });
      onAnalysisStart(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/analyses/recent"] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive",
      });
    },
  });

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value) {
      validateUrl(value);
    } else {
      setIsValidUrl(false);
    }
  };

  const handleSubmit = () => {
    if (!url || !isValidUrl || disabled) return;
    startAnalysisMutation.mutate(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const labelColor = variant === 'sidebar' ? 'text-gray-700' : 'text-gray-700';
  const sectionLabelColor = variant === 'sidebar' ? 'text-gray-900' : 'text-gray-900';
  const borderColor = variant === 'sidebar' ? 'border-gray-200' : 'border-gray-200';

  return (
    <div className="space-y-4">
      <div>
        <TooltipHover content="Enter a webpage URL to analyse how AI would break down its content into search queries">
          <Label htmlFor="url-input" className={`block text-sm font-medium ${labelColor} mb-2`}>
            Enter URL to Analyse
          </Label>
        </TooltipHover>
        <div className="relative">
          <TooltipHover content="Paste the full URL of the webpage you want to analyse" position="bottom">
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="pr-10"
              data-tooltip="url-input"
            />
          </TooltipHover>
          <button 
            className="absolute right-2 top-2 text-gray-400 hover:text-primary"
            onClick={() => url && validateUrl(url)}
          >
            <CheckCircle className={`h-5 w-5 ${isValidUrl ? 'text-primary' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>
      
      <TooltipHover content="Analyse this webpage to see how AI would break down its content into search queries and identify coverage gaps">
        <Button 
          onClick={handleSubmit}
          disabled={!url || !isValidUrl || disabled || startAnalysisMutation.isPending}
          className="w-full"
          data-tooltip="start-button"
        >
          <Play className="mr-2 h-4 w-4" />
          {startAnalysisMutation.isPending ? "Starting..." : "Start Analysis"}
        </Button>
      </TooltipHover>

      {/* Batch Analysis Section */}
      <div className={`pt-6 border-t ${borderColor}`}>
        <TooltipHover content="Process multiple URLs at once for comprehensive bulk analysis">
          <h3 className={`text-md font-medium ${sectionLabelColor} mb-3`}>Batch Analysis</h3>
        </TooltipHover>
        <div className="space-y-3">
          <div data-tooltip="batch-upload">
            <TooltipHover content="Upload a CSV file or paste multiple URLs to analyse up to 50 webpages simultaneously" position="right">
              <div>
                <BatchUpload 
                  onBatchStart={onBatchStart}
                  disabled={disabled}
                />
              </div>
            </TooltipHover>
          </div>

        </div>
        <div className="text-xs text-gray-500 mt-2">
          Analyse up to 50 URLs at once for comprehensive content audits
        </div>
      </div>
    </div>
  );
}
