import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, X, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BatchUploadProps {
  onBatchStart: (batchId: string) => void;
  disabled?: boolean;
}

export default function BatchUpload({ onBatchStart, disabled }: BatchUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startBatchMutation = useMutation({
    mutationFn: async (data: { urls: string[]; name?: string }) => {
      const response = await apiRequest("POST", "/api/analyze/batch", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Batch Analysis Started", 
        description: `Processing ${data.totalUrls} URLs. This may take several minutes.`,
      });
      onBatchStart(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/batches/recent"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Batch Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to start batch analysis",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setBatchName("");
    setUrlInput("");
    setUrls([]);
  };

  const addUrlsFromText = () => {
    if (!urlInput.trim()) return;
    
    const newUrls = urlInput
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .filter(url => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
    
    setUrls(prev => [...prev, ...newUrls]);
    setUrlInput("");
  };

  const removeUrl = (index: number) => {
    setUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (urls.length === 0) {
      toast({
        title: "No URLs",
        description: "Please add at least one valid URL",
        variant: "destructive",
      });
      return;
    }

    if (urls.length > 50) {
      toast({
        title: "Too Many URLs",
        description: "Maximum 50 URLs allowed per batch",
        variant: "destructive",
      });
      return;
    }

    startBatchMutation.mutate({
      urls,
      name: batchName || undefined
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          disabled={disabled}
          className="w-full text-xs h-8"
        >
          <Upload className="mr-1 h-3 w-3" />
          Batch Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Batch URL Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="batch-name">Batch Name (Optional)</Label>
            <Input
              id="batch-name"
              placeholder="e.g., Website Analysis Q4 2024"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="url-input">Add URLs</Label>
            <div className="space-y-2">
              <Textarea
                id="url-input"
                placeholder="Paste URLs here (one per line)&#10;https://example.com&#10;https://another-site.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                rows={4}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addUrlsFromText}
                disabled={!urlInput.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add URLs
              </Button>
            </div>
          </div>

          {urls.length > 0 && (
            <div>
              <Label>URLs to Analyze ({urls.length}/50)</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-2 space-y-1">
                {urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-1 rounded">
                    <span className="truncate flex-1">{url}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrl(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={urls.length === 0 || startBatchMutation.isPending}
            >
              {startBatchMutation.isPending ? "Starting..." : `Analyze ${urls.length} URLs`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}