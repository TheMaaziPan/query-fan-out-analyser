import { useState } from "react";
import Header from "@/components/layout/header";
import UrlInput from "@/components/analyzer/url-input";
import AnalysisResults from "@/components/analyzer/analysis-results";
import BatchResults from "@/components/analyzer/batch-results";
import LoadingModal from "@/components/analyzer/loading-modal";
import CompetitorComparison from "@/components/analyzer/competitor-comparison";
import CompetitorResults from "@/components/analyzer/competitor-results";
import TooltipGuide, { useTooltipGuide } from "@/components/ui/tooltip-guide";
import HelpButton from "@/components/ui/help-button";

import { analyzerTooltipSteps } from "@/data/tooltip-steps";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { AnalysisResponse } from "@shared/schema";

export default function Analyzer() {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentComparisonId, setCurrentComparisonId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "batch" | "comparison">("single");

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
    setCurrentComparisonId(null);
    setViewMode("batch");
    setIsAnalyzing(false);
  };

  const handleComparisonStart = (comparisonId: string) => {
    setCurrentComparisonId(comparisonId);
    setCurrentAnalysisId(null);
    setCurrentBatchId(null);
    setViewMode("comparison");
    setIsAnalyzing(false);
  };

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 
              className="text-4xl font-bold text-gray-900"
              data-tooltip="main-title"
            >
              What do LLMs look for on my webpage?
            </h1>
            <HelpButton 
              onClick={startGuide}
              showBadge={isFirstVisit}
            />
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Predict how Google's AI Mode breaks down your content into sub-queries. 
            Identify coverage gaps and get optimisation recommendations for better search visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">

                
                <UrlInput 
                  onAnalysisStart={handleAnalysisStart}
                  onBatchStart={handleBatchStart}
                  onComparisonStart={handleComparisonStart}
                  disabled={isAnalyzing}
                />


              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* View Mode Toggle */}
            <div className="flex gap-2 mb-6" data-tooltip="view-toggle">
              <Button
                variant={viewMode === "single" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("single")}
              >
                Single AI Analysis
              </Button>
              <Button
                variant={viewMode === "batch" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("batch")}
              >
                Batch AI Analysis
              </Button>
              <Button
                variant={viewMode === "comparison" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("comparison")}
              >
                Competitor Comparison
              </Button>
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

              {viewMode === "comparison" && (
                <CompetitorResults comparisonId={currentComparisonId} />
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
      

    </div>
  );
}
