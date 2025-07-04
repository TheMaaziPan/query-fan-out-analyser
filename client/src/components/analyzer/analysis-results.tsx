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
      <Card>
        <CardContent className="p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Analysis</h2>
          <p className="text-gray-600">Enter a URL to start analysing content coverage</p>
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
      {/* Analysis Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Analysis</h2>
              <p className="text-gray-600 mt-1">Predict how AI Mode breaks down your content into sub-queries</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button 
                variant="outline"
                onClick={() => handleExport('csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleExport('json')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analysis Overview</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Analysis Complete
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900 break-all">
                {analysis.url}
              </div>
              <div className="text-xs text-gray-500 mt-1">Analysed URL</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{analysis.semanticChunks || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Semantic Chunks</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg" data-tooltip="coverage-score">
              <div className="text-3xl font-bold text-orange-600">{analysis.queryCoverage || '0/0'}</div>
              <div className="text-xs text-gray-500 mt-1">Query Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Entity */}
      {analysis.primaryEntity && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Entity Identified</h3>
            <div className="bg-blue-50 border-l-4 border-primary p-4 rounded">
              <p className="text-gray-900 font-medium">{analysis.primaryEntity}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Coverage */}
      {analysis.queries && (
        <div data-tooltip="query-list">
          <QueryCoverage queries={analysis.queries} />
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Card data-tooltip="recommendations">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
            <div className="space-y-4">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-gray-900">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semantic Chunks */}
      {analysis.semanticChunksData && analysis.semanticChunksData.length > 0 && (
        <Card data-tooltip="semantic-chunks">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Semantic Chunks Detected</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Preview</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query Potential</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.semanticChunksData.map((chunk, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {chunk.type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {chunk.content.length > 100 ? `${chunk.content.substring(0, 100)}...` : chunk.content}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {chunk.length} chars
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={chunk.queryPotential === 'High' ? 'default' : 
                                 chunk.queryPotential === 'Medium' ? 'secondary' : 'outline'}
                          className={chunk.queryPotential === 'High' ? 'bg-green-100 text-green-800' :
                                   chunk.queryPotential === 'Medium' ? 'bg-orange-100 text-orange-800' :
                                   'bg-gray-100 text-gray-800'}
                        >
                          {chunk.queryPotential}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
