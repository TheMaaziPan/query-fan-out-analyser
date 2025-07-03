import { useState } from "react";
import Header from "@/components/layout/header";
import UrlInput from "@/components/analyzer/url-input";
import AnalysisResults from "@/components/analyzer/analysis-results";
import LoadingModal from "@/components/analyzer/loading-modal";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { AnalysisResponse } from "@shared/schema";

export default function Analyzer() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch recent analyses
  const { data: recentAnalyses = [] } = useQuery<AnalysisResponse[]>({
    queryKey: ["/api/analyses/recent"],
  });

  const handleAnalysisStart = (analysisId: number) => {
    setCurrentAnalysisId(analysisId);
    setIsAnalyzing(true);
  };

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Queue</h2>
                
                <UrlInput 
                  onAnalysisStart={handleAnalysisStart}
                  disabled={isAnalyzing}
                />

                {/* Recent Analyses */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Recent Analyses</h3>
                  <div className="space-y-2">
                    {recentAnalyses.length === 0 ? (
                      <p className="text-sm text-gray-500">No analyses yet</p>
                    ) : (
                      recentAnalyses.map((analysis) => (
                        <div 
                          key={analysis.id}
                          className="text-xs p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100"
                          onClick={() => setCurrentAnalysisId(analysis.id)}
                        >
                          <div className="font-medium text-gray-900 truncate">
                            {analysis.url.length > 30 ? `${analysis.url.substring(0, 30)}...` : analysis.url}
                          </div>
                          <div className="text-gray-500 flex justify-between">
                            <span>{analysis.queryCoverage || 'Processing...'}</span>
                            <span>{analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnalysisResults 
              analysisId={currentAnalysisId}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </div>
        </div>
      </div>

      <LoadingModal 
        isOpen={isAnalyzing}
        analysisId={currentAnalysisId}
      />
    </div>
  );
}
