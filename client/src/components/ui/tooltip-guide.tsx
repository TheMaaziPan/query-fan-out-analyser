import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ArrowLeft, Lightbulb, Info } from "lucide-react";
import type { TooltipStep } from "@/data/tooltip-steps";

interface TooltipGuideProps {
  steps: TooltipStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function TooltipGuide({ steps, isOpen, onClose, onComplete }: TooltipGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;

    const target = document.querySelector(steps[currentStep].target) as HTMLElement;
    if (target) {
      setTargetElement(target);
      updateTooltipPosition(target, steps[currentStep].position);

      // Add highlight effect
      if (steps[currentStep].highlight) {
        target.classList.add("tooltip-highlight");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    return () => {
      // Remove highlight when step changes
      document.querySelectorAll(".tooltip-highlight").forEach(el => {
        el.classList.remove("tooltip-highlight");
      });
    };
  }, [currentStep, isOpen, steps]);

  const updateTooltipPosition = (target: HTMLElement, position: string) => {
    const rect = target.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top + scrollY - 10;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case "bottom":
        top = rect.bottom + scrollY + 10;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case "left":
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 10;
        break;
      case "right":
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 10;
        break;
    }

    setTooltipPosition({ top, left });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Remove any remaining highlights
    document.querySelectorAll(".tooltip-highlight").forEach(el => {
      el.classList.remove("tooltip-highlight");
    });
    onComplete();
  };

  if (!isOpen || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Tooltip */}
      <div
        className="fixed z-50 max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: step.position === "top" || step.position === "bottom" 
            ? "translateX(-50%)" 
            : step.position === "left" 
            ? "translateX(-100%)" 
            : "translateX(0)"
        }}
      >
        <Card className="border-2 border-primary shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <Badge variant="secondary">{currentStep + 1} of {steps.length}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{step.description}</p>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>

              {isLastStep ? (
                <Button size="sm" onClick={handleComplete}>
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Got it!
                </Button>
              ) : (
                <Button size="sm" onClick={nextStep}>
                  Next
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Arrow pointer */}
        <div
          className={`absolute w-0 h-0 ${
            step.position === "top"
              ? "bottom-[-8px] left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"
              : step.position === "bottom"
              ? "top-[-8px] left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"
              : step.position === "left"
              ? "right-[-8px] top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white"
              : "left-[-8px] top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white"
          }`}
        />
      </div>
    </>
  );
}

// Hook for managing tooltip guide state
export function useTooltipGuide() {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("hasSeenAnalysisGuide");
    if (!hasSeenGuide) {
      setIsFirstVisit(true);
      setShowGuide(true);
    }
  }, []);

  const startGuide = () => {
    setShowGuide(true);
  };

  const closeGuide = () => {
    setShowGuide(false);
  };

  const completeGuide = () => {
    localStorage.setItem("hasSeenAnalysisGuide", "true");
    setShowGuide(false);
    setIsFirstVisit(false);
  };

  return {
    isFirstVisit,
    showGuide,
    startGuide,
    closeGuide,
    completeGuide
  };
}