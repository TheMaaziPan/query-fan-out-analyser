import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Lightbulb } from "lucide-react";
import TooltipHover from "@/components/ui/tooltip-hover";

interface HelpButtonProps {
  onClick: () => void;
  showBadge?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}

export default function HelpButton({ 
  onClick, 
  showBadge = false, 
  variant = "outline",
  size = "sm" 
}: HelpButtonProps) {
  return (
    <TooltipHover content="Take an interactive tour to learn how to use the analyzer and understand the results" position="bottom">
      <div className="relative">
        <Button 
          variant={variant} 
          size={size} 
          onClick={onClick}
          className="gap-2"
        >
          <Lightbulb className="h-4 w-4" />
          Guide
        </Button>
        {showBadge && (
          <Badge 
            className="absolute -top-2 -right-2 px-1 py-0 text-xs bg-primary text-primary-foreground"
          >
            New
          </Badge>
        )}
      </div>
    </TooltipHover>
  );
}