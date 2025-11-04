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
    id: "analysis-header",
    title: "Analysis Complete!",
    description: "Your webpage has been successfully analysed. This tool predicts how Google's AI Mode would break down your content into sub-queries.",
    target: "[data-tooltip='analysis-header']",
    position: "bottom",
    highlight: true
  },
  {
    id: "export-buttons",
    title: "Export Your Results",
    description: "Download your analysis data as CSV for spreadsheets or JSON for technical use. Perfect for reports and further analysis.",
    target: "[data-tooltip='export-buttons']",
    position: "bottom",
    highlight: true
  },
  {
    id: "analysis-overview",
    title: "Quick Overview",
    description: "See key metrics at a glance: your analysed URL, how many content sections were found, and overall query coverage.",
    target: "[data-tooltip='analysis-overview']",
    position: "bottom",
    highlight: true
  },
  {
    id: "coverage-score",
    title: "Query Coverage Score",
    description: "This fraction shows how many search queries your content fully answers. Higher coverage means better AI search visibility.",
    target: "[data-tooltip='coverage-score']",
    position: "left",
    highlight: true
  },
  {
    id: "primary-entity",
    title: "Main Topic Identified",
    description: "The AI identified the primary subject of your webpage. This helps understand what your content is mainly about.",
    target: "[data-tooltip='primary-entity']",
    position: "bottom",
    highlight: true
  },
  {
    id: "query-breakdown",
    title: "Detailed Query Analysis",
    description: "See exactly which search queries your content covers. Green means full coverage, yellow means partial, red means missing content.",
    target: "[data-tooltip='query-list']",
    position: "right",
    highlight: true
  },
  {
    id: "recommendations",
    title: "AI-Generated Recommendations",
    description: "Get specific, actionable suggestions to improve your content and capture more search traffic from AI-powered search engines.",
    target: "[data-tooltip='recommendations']",
    position: "left",
    highlight: true
  },
  {
    id: "semantic-chunks",
    title: "Content Structure Analysis",
    description: "See how the AI breaks down your content into meaningful sections and their potential for generating search queries.",
    target: "[data-tooltip='semantic-chunks']",
    position: "top",
    highlight: true
  }
];