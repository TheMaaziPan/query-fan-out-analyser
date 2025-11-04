import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Copy, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

const defaultTheme: ThemeColors = {
  primary: "#1a4d2e",     // Deep forest green
  secondary: "#4a7c59",   // Sage green
  accent: "#6b9b7a",      // Natural green
  success: "#4a7c59",     // Sage green
  warning: "#f59e0b",     // Amber warning
  error: "#dc2626",       // Red error
};

const presetThemes = {
  "Natural Green": {
    primary: "#1a4d2e",
    secondary: "#4a7c59",
    accent: "#6b9b7a",
    success: "#4a7c59",
    warning: "#f59e0b",
    error: "#dc2626"
  },
  "Professional Blue": {
    primary: "#2563eb",
    secondary: "#1e40af", 
    accent: "#3730a3",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626"
  },
  "Modern Purple": {
    primary: "#7c3aed",
    secondary: "#5b21b6",
    accent: "#c026d3",
    success: "#059669",
    warning: "#d97706", 
    error: "#dc2626"
  },
  "Corporate Grey": {
    primary: "#374151",
    secondary: "#6b7280",
    accent: "#9ca3af",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626"
  },
  "Vibrant Orange": {
    primary: "#ea580c",
    secondary: "#c2410c",
    accent: "#fed7aa",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626"
  },
  "Tech Green": {
    primary: "#059669",
    secondary: "#047857",
    accent: "#10b981",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626"
  }
};

export default function ThemeCustomizer() {
  const [colors, setColors] = useState<ThemeColors>(defaultTheme);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  // Convert hex to HSL for CSS variables
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  };

  // Apply theme to CSS variables
  const applyTheme = (theme: ThemeColors) => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', `hsl(${hexToHsl(theme.primary)})`);
    root.style.setProperty('--brand-secondary', `hsl(${hexToHsl(theme.secondary)})`);
    root.style.setProperty('--brand-accent', `hsl(${hexToHsl(theme.accent)})`);
    root.style.setProperty('--brand-success', `hsl(${hexToHsl(theme.success)})`);
    root.style.setProperty('--brand-warning', `hsl(${hexToHsl(theme.warning)})`);
    root.style.setProperty('--brand-error', `hsl(${hexToHsl(theme.error)})`);
    
    // Update primary for components
    root.style.setProperty('--primary', `hsl(${hexToHsl(theme.primary)})`);
  };

  const handleColorChange = (colorKey: keyof ThemeColors, value: string) => {
    const newColors = { ...colors, [colorKey]: value };
    setColors(newColors);
    applyTheme(newColors);
  };

  const applyPreset = (presetName: string) => {
    const preset = presetThemes[presetName as keyof typeof presetThemes];
    setColors(preset);
    applyTheme(preset);
    toast({
      title: "Theme Applied",
      description: `${presetName} theme has been applied`,
    });
  };

  const generateCSS = () => {
    return `:root {
  --brand-primary: hsl(${hexToHsl(colors.primary)});
  --brand-secondary: hsl(${hexToHsl(colors.secondary)});
  --brand-accent: hsl(${hexToHsl(colors.accent)});
  --brand-success: hsl(${hexToHsl(colors.success)});
  --brand-warning: hsl(${hexToHsl(colors.warning)});
  --brand-error: hsl(${hexToHsl(colors.error)});
  --primary: hsl(${hexToHsl(colors.primary)});
}`;
  };

  const copyCSS = () => {
    navigator.clipboard.writeText(generateCSS());
    toast({
      title: "CSS Copied",
      description: "Theme CSS has been copied to clipboard",
    });
  };

  const downloadCSS = () => {
    const css = generateCSS();
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-theme.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetTheme = () => {
    setColors(defaultTheme);
    applyTheme(defaultTheme);
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default",
    });
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Palette className="h-4 w-4 mr-2" />
        Customize Theme
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Theme Customizer</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Themes */}
          <div>
            <Label className="text-xs font-medium mb-2 block">Quick Presets</Label>
            <div className="flex flex-wrap gap-1">
              {Object.keys(presetThemes).map((preset) => (
                <Badge
                  key={preset}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                  onClick={() => applyPreset(preset)}
                >
                  {preset}
                </Badge>
              ))}
            </div>
          </div>

          {/* Color Inputs */}
          <div className="space-y-3">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Label className="text-xs capitalize w-16">{key}</Label>
                <div className="flex items-center space-x-2 flex-1">
                  <Input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                    className="w-8 h-8 p-0 border-0"
                  />
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                    className="text-xs h-8"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={copyCSS} className="flex-1">
              <Copy className="h-3 w-3 mr-1" />
              Copy CSS
            </Button>
            <Button size="sm" variant="outline" onClick={downloadCSS} className="flex-1">
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            <Button size="sm" variant="outline" onClick={resetTheme}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {/* Preview Section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Preview</Label>
            <div className="space-y-2">
              <Button size="sm" className="w-full">Primary Button</Button>
              <div className="flex space-x-1">
                <Badge className="status-success text-xs">Success</Badge>
                <Badge className="status-warning text-xs">Warning</Badge>
                <Badge className="status-error text-xs">Error</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}