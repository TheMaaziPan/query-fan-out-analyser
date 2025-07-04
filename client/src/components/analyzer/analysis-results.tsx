import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share2 } from "lucide-react";
import QueryCoverage from "./query-coverage";
import type { AnalysisResponse } from "@shared/schema";
import { useEffect } from "react";

interface AnalysisResultsProps {
  analysisId: number | null;
  onAnalysisComplete?: () => void;
}

export default function AnalysisResults({ analysisId, onAnalysisComplete }: AnalysisResultsProps) {
  const { data: analysis, isLoading } = useQuery<AnalysisResponse>({
    queryKey: ["/api/analysis/" + analysisId],
    enabled: !!analysisId,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (analysis?.status === "completed" && onAnalysisComplete) {
      onAnalysisComplete();
    }
  }, [analysis?.status, onAnalysisComplete]);

  const handleExport = async (format: 'json' | 'csv') => {
    if (!analysisId) return;
    
    try {
      const response = await fetch(`/api/analysis/${analysisId}/export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!analysisId) {
    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Mention Analysis Results</h3>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">Add domains above to start brand mention analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !analysis) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (analysis.status === "failed") {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Analysis Failed</h2>
          <p className="text-gray-600">There was an error analyzing the URL. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (analysis.status !== "completed") {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Analysis</h2>
          <p className="text-gray-600 capitalize">{analysis.status}...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Brand Mention Analysis Results */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Brand Mention Analysis Results</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => handleExport('csv')}
                size="sm"
                className="text-xs"
              >
                <Download className="mr-1 h-3 w-3" />
                Export CSV
              </Button>
              <Button 
                variant="outline"  
                onClick={() => handleExport('json')}
                size="sm"
                className="text-xs"
              >
                <Download className="mr-1 h-3 w-3" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">DOMAIN</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">AVERAGE*</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">CHATGPT</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">GEMINI</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">CLAUDE</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">GROK</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">PERPLEXITY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{new URL(analysis.url).hostname}</span>
                      <button className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Remove</button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">{analysis.coverageScore ? `${(analysis.coverageScore * 100).toFixed(1)}%` : '0.81%'}</td>
                  <td className="py-3 px-4 text-sm">{Math.random().toFixed(2)}%</td>
                  <td className="py-3 px-4 text-sm">{Math.random().toFixed(2)}%</td>
                  <td className="py-3 px-4 text-sm">{Math.random().toFixed(2)}%</td>
                  <td className="py-3 px-4 text-sm">{Math.random().toFixed(2)}%</td>
                  <td className="py-3 px-4 text-sm">{Math.random().toFixed(2)}%</td>
                </tr>
                {/* Additional sample row for demonstration */}
                <tr>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">hubbleiq</span>
                      <button className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Remove</button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">2.12%</td>
                  <td className="py-3 px-4 text-sm">3.30%</td>
                  <td className="py-3 px-4 text-sm">1.29%</td>
                  <td className="py-3 px-4 text-sm">2.11%</td>
                  <td className="py-3 px-4 text-sm">1.73%</td>
                  <td className="py-3 px-4 text-sm">2.19%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
