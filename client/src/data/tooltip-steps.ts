export interface TooltipStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
}

export const analyzerTooltipSteps: TooltipStep[] = [
  {
    id: "welcome",
    title: "Welcome to AI Analysis!",
    description: "This tool predicts how LLMs like Google's AI Mode break down your webpage content into sub-queries. Let's explore the features!",
    target: "[data-tooltip='main-title']",
    position: "bottom",
    highlight: true
  },
  {
    id: "analysis-modes",
    title: "Three Analysis Modes",
    description: "Choose between single page analysis, batch processing multiple URLs, or comparing competitors side-by-side.",
    target: "[data-tooltip='view-toggle']",
    position: "bottom",
    highlight: true
  },
  {
    id: "url-input",
    title: "Enter Your URL",
    description: "Paste any webpage URL here. The AI will analyse how well your content answers potential search queries.",
    target: "[data-tooltip='url-input']",
    position: "right",
    highlight: true
  },
  {
    id: "start-analysis",
    title: "Start the Analysis",
    description: "Click here to begin. The AI will scrape your page, extract semantic chunks, and generate relevant queries.",
    target: "[data-tooltip='start-button']",
    position: "top",
    highlight: true
  },
  {
    id: "batch-upload",
    title: "Batch Analysis",
    description: "Upload a CSV file with multiple URLs to analyse up to 50 pages simultaneously. Perfect for large content audits.",
    target: "[data-tooltip='batch-upload']",
    position: "right",
    highlight: true
  },
  {
    id: "competitor-comparison",
    title: "Competitor Comparison",
    description: "Compare your content against competitors to identify gaps and opportunities. See what queries they cover that you don't.",
    target: "[data-tooltip='competitor-comparison']",
    position: "right",
    highlight: true
  },
  {
    id: "recent-analyses",
    title: "Recent Analyses",
    description: "View your analysis history here. Click any previous analysis to see detailed results and recommendations.",
    target: "[data-tooltip='recent-analyses']",
    position: "left",
    highlight: true
  },
  {
    id: "results-explanation",
    title: "Understanding Results",
    description: "Results show query coverage scores, content gaps, and AI-generated recommendations to improve your content for better search visibility.",
    target: "[data-tooltip='results-area']",
    position: "top",
    highlight: false
  }
];

export const resultsTooltipSteps: TooltipStep[] = [
  {
    id: "coverage-score",
    title: "Coverage Score",
    description: "This shows how well your content answers potential search queries. Higher scores mean better AI search visibility.",
    target: "[data-tooltip='coverage-score']",
    position: "bottom",
    highlight: true
  },
  {
    id: "query-breakdown",
    title: "Query Analysis",
    description: "See which search queries your content fully covers (Yes), partially covers (Partial), or completely misses (No).",
    target: "[data-tooltip='query-list']",
    position: "right",
    highlight: true
  },
  {
    id: "recommendations",
    title: "AI Recommendations",
    description: "Get specific, actionable suggestions to improve your content and capture more search traffic.",
    target: "[data-tooltip='recommendations']",
    position: "left",
    highlight: true
  },
  {
    id: "semantic-chunks",
    title: "Content Structure",
    description: "View how the AI breaks down your content into semantic chunks and their potential for generating queries.",
    target: "[data-tooltip='semantic-chunks']",
    position: "top",
    highlight: true
  }
];