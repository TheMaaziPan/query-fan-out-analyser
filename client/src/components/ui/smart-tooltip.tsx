import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { X } from "lucide-react";

interface SmartTooltipProps {
  title: string;
  description: string;
  target: string;
  isVisible: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose: () => void;
  showNavigation?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function SmartTooltip({
  title,
  description,
  target,
  isVisible,
  onNext,
  onPrevious,
  onClose,
  showNavigation = false,
  isFirst = false,
  isLast = false,
}: SmartTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return;

    const targetElement = document.querySelector(target);
    if (!targetElement) return;

    // Update viewport width for style calculations
    setViewportWidth(window.innerWidth);

    const calculatePosition = () => {
      const targetRect = targetElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const padding = 20; // Increased padding for better safety
      const tooltipWidth = Math.min(320, viewportWidth - (padding * 2));
      const tooltipHeight = 250; // More conservative height estimate

      // Calculate absolute viewport boundaries
      const viewportTop = scrollY;
      const viewportBottom = scrollY + viewportHeight;
      const viewportLeft = scrollX;
      const viewportRight = scrollX + viewportWidth;

      // Calculate safe boundaries for tooltip placement
      const safeTop = viewportTop + padding;
      const safeBottom = viewportBottom - tooltipHeight - padding;
      const safeLeft = viewportLeft + padding;
      const safeRight = viewportRight - tooltipWidth - padding;

      let top = 0;
      let left = 0;
      let arrow: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

      // Try to center tooltip horizontally relative to target
      const preferredLeft = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipWidth / 2);
      left = Math.max(safeLeft, Math.min(safeRight, preferredLeft));

      // Determine vertical position based on available space
      const targetTop = targetRect.top + scrollY;
      const targetBottom = targetRect.bottom + scrollY;
      
      const spaceBelow = safeBottom - targetBottom;
      const spaceAbove = targetTop - safeTop;

      if (spaceBelow >= 12 && spaceBelow >= spaceAbove) {
        // Position below target
        top = Math.min(targetBottom + 12, safeBottom);
        arrow = 'top';
      } else if (spaceAbove >= 12) {
        // Position above target
        top = Math.max(targetTop - tooltipHeight - 12, safeTop);
        arrow = 'bottom';
      } else {
        // Not enough vertical space, try horizontal positioning
        const targetMiddleY = targetTop + (targetRect.height / 2);
        top = Math.max(safeTop, Math.min(safeBottom, targetMiddleY - (tooltipHeight / 2)));
        
        const spaceRight = safeRight - (targetRect.right + scrollX);
        const spaceLeft = (targetRect.left + scrollX) - safeLeft;
        
        if (spaceRight >= 12 && spaceRight >= spaceLeft) {
          // Position to the right
          left = Math.min(targetRect.right + scrollX + 12, safeRight);
          arrow = 'left';
        } else if (spaceLeft >= 12) {
          // Position to the left
          left = Math.max(targetRect.left + scrollX - tooltipWidth - 12, safeLeft);
          arrow = 'right';
        } else {
          // Last resort: center in viewport
          top = Math.max(safeTop, Math.min(safeBottom, viewportTop + (viewportHeight / 2) - (tooltipHeight / 2)));
          left = Math.max(safeLeft, Math.min(safeRight, viewportLeft + (viewportWidth / 2) - (tooltipWidth / 2)));
          arrow = 'bottom';
        }
      }

      return { top, left, arrow };
    };

    // Use setTimeout to allow tooltip to render first, then position it
    const timeout = setTimeout(() => {
      const positionData = calculatePosition();
      setPosition({ top: positionData.top, left: positionData.left });
      setArrowPosition(positionData.arrow);
    }, 10);

    // Highlight target element
    targetElement.classList.add('tooltip-highlight');
    
    // Recalculate on scroll or resize
    const handleReposition = () => {
      setViewportWidth(window.innerWidth);
      const newPosition = calculatePosition();
      setPosition({ top: newPosition.top, left: newPosition.left });
      setArrowPosition(newPosition.arrow);
    };

    window.addEventListener('scroll', handleReposition);
    window.addEventListener('resize', handleReposition);
    
    return () => {
      clearTimeout(timeout);
      targetElement.classList.remove('tooltip-highlight');
      window.removeEventListener('scroll', handleReposition);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isVisible, target]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose} />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 w-80 max-w-[calc(100vw-40px)] bg-white rounded-lg shadow-xl border border-gray-200 p-6"
        style={{ 
          top: `${Math.max(20, position.top)}px`, 
          left: `${Math.max(20, Math.min(viewportWidth - 340, position.left))}px`,
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'auto'
        }}
      >
        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-white border transform rotate-45 ${
            arrowPosition === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0' :
            arrowPosition === 'bottom' ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0' :
            arrowPosition === 'left' ? '-left-1.5 top-1/2 -translate-y-1/2 border-t-0 border-r-0' :
            '-right-1.5 top-1/2 -translate-y-1/2 border-b-0 border-l-0'
          }`}
        />

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 p-1 h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>

          {/* Navigation */}
          {showNavigation && (
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={isFirst}
              >
                Previous
              </Button>
              
              <Button
                size="sm"
                onClick={isLast ? onClose : onNext}
              >
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}