import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ComparisonResponse } from "@shared/schema";

interface CompetitorComparisonProps {
  onComparisonStart?: (comparisonId: string) => void;
  disabled?: boolean;
}

export default function CompetitorComparison({ onComparisonStart, disabled }: CompetitorComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comparisonName, setComparisonName] = useState("");
  const [description, setDescription] = useState("");
  const [urls, setUrls] = useState<string[]>(["", ""]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startComparisonMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; urls: string[] }) => {
      const response = await apiRequest("POST", "/api/compare", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Competitor Analysis Started",
        description: `Comparing ${data.totalUrls} competitors. This may take several minutes.`,
      });
      if (onComparisonStart) {
        onComparisonStart(data.id);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/comparisons/recent"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Comparison Failed",
        description: error instanceof Error ? error.message : "Failed to start competitor comparison",
        variant: "destructive",
      });
    },
  });

  const addUrl = () => {
    if (urls.length < 10) {
      setUrls([...urls, ""]);
    }
  };

  const removeUrl = (index: number) => {
    if (urls.length > 2) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const validateUrls = () => {
    const validUrls = urls.filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
    return validUrls.length >= 2;
  };

  const handleSubmit = () => {
    if (!comparisonName.trim() || !validateUrls() || disabled) return;
    
    const validUrls = urls.filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    startComparisonMutation.mutate({
      name: comparisonName,
      description: description || undefined,
      urls: validUrls
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setComparisonName("");
    setDescription("");
    setUrls(["", ""]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          disabled={disabled}
          className="w-full text-sm"
        >
          <Users className="mr-2 h-4 w-4" />
          Competitor Comparison
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Competitor Comparison Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="comparison-name">Comparison Name</Label>
            <Input
              id="comparison-name"
              placeholder="e.g., Office Space Providers Q4 2024"
              value={comparisonName}
              onChange={(e) => setComparisonName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this comparison..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label>Competitor URLs</Label>
            <div className="space-y-2 mt-2">
              {urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`https://competitor${index + 1}.com`}
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    className="flex-1"
                  />
                  {urls.length > 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeUrl(index)}
                      className="px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {urls.length < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addUrl}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Competitor
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Compare 2-10 competitor websites
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!comparisonName.trim() || !validateUrls() || disabled || startComparisonMutation.isPending}
              className="flex-1"
            >
              {startComparisonMutation.isPending ? "Starting..." : "Start Comparison"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}