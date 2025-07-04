import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BatchUpload from "./batch-upload";
import CompetitorComparison from "./competitor-comparison";

interface UrlInputProps {
  onAnalysisStart: (analysisId: number) => void;
  onBatchStart: (batchId: string) => void;
  onComparisonStart?: (comparisonId: string) => void;
  disabled?: boolean;
}

export default function UrlInput({ onAnalysisStart, onBatchStart, onComparisonStart, disabled }: UrlInputProps) {
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

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
          Enter URL to Analyse
        </Label>
        <div className="relative">
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com/page"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            className="pr-10"
          />
          <button 
            className="absolute right-2 top-2 text-gray-400 hover:text-primary"
            onClick={() => url && validateUrl(url)}
          >
            <CheckCircle className={`h-5 w-5 ${isValidUrl ? 'text-green-500' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>
      
      <Button 
        onClick={handleSubmit}
        disabled={!url || !isValidUrl || disabled || startAnalysisMutation.isPending}
        className="w-full bg-primary text-white hover:bg-blue-700"
      >
        <Play className="mr-2 h-4 w-4" />
        {startAnalysisMutation.isPending ? "Starting..." : "Start Analysis"}
      </Button>

      {/* Batch Analysis Section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-3">Batch Analysis</h3>
        <div className="space-y-3">
          <BatchUpload 
            onBatchStart={onBatchStart}
            disabled={disabled}
          />
          <CompetitorComparison 
            onComparisonStart={onComparisonStart}
            disabled={disabled}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Analyse up to 50 URLs at once or compare up to 10 competitors
        </div>
      </div>
    </div>
  );
}
