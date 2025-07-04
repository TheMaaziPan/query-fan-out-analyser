import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BatchUpload from "./batch-upload";

interface UrlInputProps {
  onAnalysisStart: (analysisId: number) => void;
  onBatchStart: (batchId: string) => void;
  disabled?: boolean;
}

export default function UrlInput({ onAnalysisStart, onBatchStart, disabled }: UrlInputProps) {
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
      {/* Quick Add Pills */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Quick add:</div>
        <div className="flex flex-wrap gap-1">
          {['New Look', 'Primark', 'Urban Outfitters', 'Accessorize', 'Hush', 'Monsoon'].map((brand) => (
            <button
              key={brand}
              onClick={() => handleUrlChange(`https://${brand.toLowerCase().replace(' ', '')}.com`)}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Label htmlFor="domain-input" className="block text-xs font-medium text-gray-700 mb-1">
            Domain or Brand Name
          </Label>
          <Input
            id="domain-input"
            type="text"
            placeholder="e.g., booking.com"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            className="text-sm h-8"
          />
        </div>
        <div>
          <Label htmlFor="industry" className="block text-xs font-medium text-gray-700 mb-1">
            Industry
          </Label>
          <select className="w-full h-8 text-xs border border-gray-300 rounded-md px-2 bg-white">
            <option>Fashion & Retail</option>
            <option>Technology</option>
            <option>Travel</option>
            <option>Finance</option>
          </select>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={handleSubmit}
          disabled={!url || disabled || startAnalysisMutation.isPending}
          className="flex-1 bg-gray-800 text-white hover:bg-gray-900 h-8 text-xs"
        >
          {startAnalysisMutation.isPending ? "Adding..." : "Add Domain"}
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!url || disabled || startAnalysisMutation.isPending}
          className="flex-1 bg-gray-800 text-white hover:bg-gray-900 h-8 text-xs"
        >
          Run Analysis
        </Button>
        <Button 
          variant="outline"
          className="px-3 h-8 text-xs"
        >
          Clear All
        </Button>
      </div>

      {/* Batch Analysis Section */}
      <div className="pt-4 border-t border-gray-200">
        <BatchUpload 
          onBatchStart={onBatchStart}
          disabled={disabled}
        />
        <div className="text-xs text-gray-500 mt-2">
          Analyse up to 50 URLs at once
        </div>
      </div>
    </div>
  );
}
