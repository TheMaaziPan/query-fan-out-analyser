import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { AnalysisResponse } from "@shared/schema";

interface LoadingModalProps {
  isOpen: boolean;
  analysisId: number | null;
}

export default function LoadingModal({ isOpen, analysisId }: LoadingModalProps) {
  const { data: analysis } = useQuery<AnalysisResponse>({
    queryKey: ["/api/analysis/" + analysisId],
    enabled: !!analysisId && isOpen,
    refetchInterval: 2000,
  });

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Initialising analysis...';
      case 'scraping':
        return 'Extracting content from webpage...';
      case 'chunking':
        return 'Identifying semantic chunks...';
      case 'analysing':
        return 'Processing with AI...';
      default:
        return 'Processing...';
    }
  };

  const getProgress = (status: string) => {
    switch (status) {
      case 'pending':
        return 20;
      case 'scraping':
        return 40;
      case 'chunking':
        return 60;
      case 'analysing':
        return 80;
      case 'completed':
        return 100;
      default:
        return 10;
    }
  };

  const getStep = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Step 1 of 4';
      case 'scraping':
        return 'Step 2 of 4';
      case 'chunking':
        return 'Step 3 of 4';
      case 'analysing':
        return 'Step 4 of 4';
      default:
        return 'Processing';
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-lg font-semibold text-gray-900 text-center">
          Analysing Content...
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-600 text-center">
          {analysis ? getStatusMessage(analysis.status) : 'Processing semantic chunks and generating queries with AI'}
        </DialogDescription>
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${analysis ? getProgress(analysis.status) : 10}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {analysis ? getStep(analysis.status) : 'Initialising...'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
