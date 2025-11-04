import { useState } from "react";
import Header from "@/components/layout/header";
import UrlInput from "@/components/analyzer/url-input";
import AnalysisResults from "@/components/analyzer/analysis-results";
import BatchResults from "@/components/analyzer/batch-results";
import LoadingModal from "@/components/analyzer/loading-modal";

import TooltipGuide, { useTooltipGuide } from "@/components/ui/tooltip-guide";
import HelpButton from "@/components/ui/help-button";
import TooltipHover from "@/components/ui/tooltip-hover";

import { analyzerTooltipSteps } from "@/data/tooltip-steps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { AnalysisResponse } from "@shared/schema";

export default function Analyzer() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "batch">("single");

  // Tooltip guide state
  const { isFirstVisit, showGuide, startGuide, closeGuide, completeGuide } = useTooltipGuide();

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
    <>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Fixed Sidebar - Hidden on mobile, visible on desktop */}
        <div 
          className="w-80 fixed left-0 top-16 bottom-0 overflow-y-auto z-40 hidden lg:block bg-gradient-to-b from-gray-50 to-white border-r border-gray-200"
        >
          <div className="p-6">
            <UrlInput 
              onAnalysisStart={handleAnalysisStart}
              onBatchStart={handleBatchStart}
              disabled={isAnalyzing}
            />
          </div>
        </div>
        
        {/* Main Content with responsive margins */}
        <div className="lg:ml-80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Mobile URL Input - Only visible on mobile */}
            <div className="lg:hidden mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <UrlInput 
                  onAnalysisStart={handleAnalysisStart}
                  onBatchStart={handleBatchStart}
                  disabled={isAnalyzing}
                  variant="mobile"
                />
              </div>
            </div>
            
            {/* Page Header */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3"
                    data-tooltip="main-title"
                  >
                    Understand How AI Interprets Your Content
                  </h1>
                  <p className="text-lg text-gray-600 max-w-3xl">
                    Predict how Google's AI Mode breaks down your webpage into search queries. Identify coverage gaps and get optimisation recommendations.
                  </p>
                </div>
                <HelpButton 
                  onClick={startGuide}
                  showBadge={isFirstVisit}
                />
              </div>
            </div>
            {/* View Mode Toggle */}
            <div className="flex gap-3 mb-8" data-tooltip="view-toggle">
              <TooltipHover content="View results from individual webpage analysis">
                <Button
                  variant={viewMode === "single" ? "default" : "outline"}
                  onClick={() => setViewMode("single")}
                  className="rounded-full px-6"
                >
                  Single AI Analysis
                </Button>
              </TooltipHover>
              <TooltipHover content="View results from bulk analysis of multiple webpages">
                <Button
                  variant={viewMode === "batch" ? "default" : "outline"}
                  onClick={() => setViewMode("batch")}
                  className="rounded-full px-6"
                >
                  Batch AI Analysis
                </Button>
              </TooltipHover>
            </div>

            {/* Results Display */}
            <div data-tooltip="results-area">
              {viewMode === "single" && (
                <AnalysisResults 
                  analysisId={currentAnalysisId}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              )}

              {viewMode === "batch" && (
                <BatchResults batchId={currentBatchId} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <LoadingModal 
        isOpen={isAnalyzing}
        analysisId={currentAnalysisId}
      />
      
      {/* Tooltip Guide */}
      <TooltipGuide
        steps={analyzerTooltipSteps}
        isOpen={showGuide}
        onClose={closeGuide}
        onComplete={completeGuide}
      />
    </>
  );
}
