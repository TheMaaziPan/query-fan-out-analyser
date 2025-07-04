import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, ExternalLink } from "lucide-react";
import type { BatchResponse } from "@shared/schema";

interface BatchResultsProps {
  batchId: string | null;
}

export default function BatchResults({ batchId }: BatchResultsProps) {
  const { data: batch, isLoading } = useQuery<BatchResponse>({
    queryKey: ["/api/batch/" + batchId],
    enabled: !!batchId,
    refetchInterval: 3000, // Poll every 3 seconds for now
  });

  if (!batchId) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch AI Analysis</h2>
          <p className="text-gray-600">Upload multiple URLs to analyse them all at once</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !batch) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading batch analysis...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgress = () => {
    if (batch.status === 'completed') return 100;
    if (batch.status === 'failed') return 0;
    return Math.round(((batch.completedUrls + batch.failedUrls) / batch.totalUrls) * 100);
  };

  const handleExportBatch = async () => {
    if (!batch.analyses) return;
    
    try {
      const csvData = [
        'URL,Title,Primary Entity,Coverage Score,Query Coverage,Status',
        ...batch.analyses.map(analysis => 
          `"${analysis.url}","${analysis.title || 'N/A'}","${analysis.primaryEntity || 'N/A'}",${analysis.coverageScore || 0},"${analysis.queryCoverage || 'N/A'}","${analysis.status}"`
        )
      ].join('\n');
      
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-analysis-${batch.id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{batch.name}</CardTitle>
              <p className="text-gray-600 mt-1">Batch ID: {batch.id}</p>
            </div>
            <Badge className={getStatusColor(batch.status)}>
              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{batch.completedUrls + batch.failedUrls} / {batch.totalUrls}</span>
              </div>
              <Progress value={getProgress()} className="w-full" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{batch.completedUrls}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{batch.failedUrls}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{batch.totalUrls - batch.completedUrls - batch.failedUrls}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>

            {batch.status === 'completed' && (
              <div className="flex justify-center pt-4">
                <Button onClick={handleExportBatch}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Results
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Results */}
      {batch.analyses && batch.analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {batch.analyses.map((analysis) => (
                <div 
                  key={analysis.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <a 
                          href={analysis.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium flex items-center gap-1"
                        >
                          {analysis.title || analysis.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      
                      {analysis.status === 'completed' && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Coverage:</span>
                            <span className="ml-1 font-medium">{analysis.queryCoverage}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Score:</span>
                            <span className="ml-1 font-medium">{analysis.coverageScore}/10</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Entity:</span>
                            <span className="ml-1 font-medium">{analysis.primaryEntity || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                      
                      {analysis.status !== 'completed' && analysis.status !== 'failed' && (
                        <p className="text-sm text-gray-600 capitalize">
                          {analysis.status === 'pending' ? 'Waiting to start...' : 
                           analysis.status === 'scraping' ? 'Extracting content...' :
                           analysis.status === 'chunking' ? 'Processing content...' :
                           analysis.status === 'analyzing' ? 'Analyzing with AI...' : 
                           analysis.status}
                        </p>
                      )}
                    </div>
                    
                    <Badge 
                      className={
                        analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                        analysis.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {analysis.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}