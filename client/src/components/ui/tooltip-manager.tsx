import { useState, useEffect } from "react";
import SmartTooltip from "./smart-tooltip";
import type { TooltipStep } from "@/data/tooltip-steps";

interface TooltipManagerProps {
  steps: TooltipStep[];
  isActive: boolean;
  onComplete: () => void;
}

export default function TooltipManager({ steps, isActive, onComplete }: TooltipManagerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(0);
    }
  }, [isActive]);

  if (!isActive || steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentStepIndex];
  
  // Check if target element exists before showing tooltip
  const targetExists = document.querySelector(currentStep.target);
  if (!targetExists) {
    // Skip to next step if target doesn't exist
    if (currentStepIndex < steps.length - 1) {
      setTimeout(() => setCurrentStepIndex(currentStepIndex + 1), 100);
    } else {
      setTimeout(onComplete, 100);
    }
    return null;
  }

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleClose = () => {
    onComplete();
  };

  return (
    <SmartTooltip
      title={currentStep.title}
      description={currentStep.description}
      target={currentStep.target}
      isVisible={true}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onClose={handleClose}
      showNavigation={true}
      isFirst={currentStepIndex === 0}
      isLast={currentStepIndex === steps.length - 1}
    />
  );
}