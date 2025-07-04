import { useState } from "react";
import Header from "@/components/layout/header";
import UrlInput from "@/components/analyzer/url-input";
import AnalysisResults from "@/components/analyzer/analysis-results";
import BatchResults from "@/components/analyzer/batch-results";
import LoadingModal from "@/components/analyzer/loading-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { AnalysisResponse } from "@shared/schema";

export default function Analyzer() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "batch">("single");

  // Fetch recent analyses
  const { data: recentAnalyses = [] } = useQuery<AnalysisResponse[]>({
    queryKey: ["/api/analyses/recent"],
  });

  const handleAnalysisStart = (analysisId: number) => {
    setCurrentAnalysisId(analysisId);
    setCurrentBatchId(null);
    setViewMode("single");
    setIsAnalyzing(true);
  };

  const handleBatchStart = (batchId: string) => {
    setCurrentBatchId(batchId);
    setCurrentAnalysisId(null);
    setViewMode("batch");
    setIsAnalyzing(false);
  };

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-main flex">
      {/* Dark Sidebar */}
      <div className="w-64 bg-sidebar text-sidebar flex-shrink-0">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <span className="text-xs font-bold text-gray-900">✓</span>
            </div>
            <span className="font-semibold text-lg">MediaVision</span>
          </div>
          
          <nav className="space-y-1">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-3">Navigation</div>
            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded">Foresight</a>
            
            <div className="bg-sidebar-accent px-3 py-2 rounded text-sm font-medium text-black">
              LLM Brand Mention Tracker
            </div>
            
            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded">Admin</a>
            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded">Research</a>
            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded">Optimisation</a>
            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded">Results</a>
            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded">Campaign Master</a>
            <a href="#" className="block px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover rounded">PR</a>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Analysis Controls */}
              <div className="lg:col-span-1">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Add Domains for Analysis</h3>
                    
                    <UrlInput 
                      onAnalysisStart={handleAnalysisStart}
                      onBatchStart={handleBatchStart}
                      disabled={isAnalyzing}
                    />

                    {/* Recent Analyses */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider">Recent Analyses</h4>
                      <div className="space-y-2">
                        {recentAnalyses.length === 0 ? (
                          <p className="text-xs text-gray-500">No analyses yet</p>
                        ) : (
                          recentAnalyses.map((analysis) => (
                            <div 
                              key={analysis.id}
                              className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 border"
                              onClick={() => setCurrentAnalysisId(analysis.id)}
                            >
                              <div className="font-medium text-gray-900 truncate">
                                {analysis.url.length > 25 ? `${analysis.url.substring(0, 25)}...` : analysis.url}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {analysis.queryCoverage || 'Processing...'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Area */}
              <div className="lg:col-span-3">
                {/* View Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={viewMode === "single" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("single")}
                    className="text-xs"
                  >
                    Single Analysis
                  </Button>
                  <Button
                    variant={viewMode === "batch" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("batch")}
                    className="text-xs"
                  >
                    Batch Analysis
                  </Button>
                </div>

                {/* Results Display */}
                {viewMode === "single" ? (
                  <AnalysisResults 
                    analysisId={currentAnalysisId}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                ) : (
                  <BatchResults batchId={currentBatchId} />
                )}
              </div>
            </div>
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
