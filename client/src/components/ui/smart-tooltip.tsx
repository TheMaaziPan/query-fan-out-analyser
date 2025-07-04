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

  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return;

    const targetElement = document.querySelector(target);
    if (!targetElement) return;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    // Calculate available space in each direction
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceLeft = targetRect.left;
    const spaceRight = viewportWidth - targetRect.right;

    let top = 0;
    let left = 0;
    let arrow: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

    // Determine best position based on available space
    if (spaceBelow >= 200 || spaceBelow > spaceAbove) {
      // Position below target
      top = targetRect.bottom + scrollY + 12;
      left = targetRect.left + scrollX + (targetRect.width / 2) - (320 / 2); // 320 is tooltip width
      arrow = 'top';
    } else if (spaceAbove >= 200) {
      // Position above target
      top = targetRect.top + scrollY - tooltipRect.height - 12;
      left = targetRect.left + scrollX + (targetRect.width / 2) - (320 / 2);
      arrow = 'bottom';
    } else if (spaceRight >= 320) {
      // Position to the right
      top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
      left = targetRect.right + scrollX + 12;
      arrow = 'left';
    } else {
      // Position to the left
      top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
      left = targetRect.left + scrollX - 320 - 12;
      arrow = 'right';
    }

    // Ensure tooltip stays within viewport bounds
    if (left < 12) left = 12;
    if (left + 320 > viewportWidth - 12) left = viewportWidth - 320 - 12;
    if (top < scrollY + 12) top = scrollY + 12;
    if (top + tooltipRect.height > scrollY + viewportHeight - 12) {
      top = scrollY + viewportHeight - tooltipRect.height - 12;
    }

    setPosition({ top, left });
    setArrowPosition(arrow);

    // Highlight target element
    targetElement.classList.add('tooltip-highlight');
    
    return () => {
      targetElement.classList.remove('tooltip-highlight');
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
        className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-6"
        style={{ top: position.top, left: position.left }}
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