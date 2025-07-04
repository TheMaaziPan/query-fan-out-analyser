import type { AnalysisResponse, QueryResult, ComparisonResponse } from "@shared/schema";

export interface ComparisonAnalysis {
  baselineUrl: string;
  baselineTitle: string | null;
  topQueries: Array<{
    query: string;
    coverage: Array<{
      url: string;
      hasContent: boolean;
      coverageLevel: "Yes" | "Partial" | "No";
      isBaseline: boolean;
    }>;
  }>;
  coverageGaps: Array<{
    query: string;
    missingFrom: string[];
    baselineHas: boolean;
  }>;
  competitorAdvantages: Array<{
    url: string;
    uniqueQueries: string[];
    betterCoverage: string[];
  }>;
  baselineAdvantages: Array<{
    query: string;
    description: string;
  }>;
}

export function performComparisonAnalysis(analyses: AnalysisResponse[]): ComparisonAnalysis {
  if (analyses.length < 2) {
    throw new Error("At least two analyses are required for comparison");
  }

  // First analysis is the baseline
  const baseline = analyses[0];
  const competitors = analyses.slice(1);
  
  // Collect all unique queries from all analyses
  const allQueries = new Map<string, Set<string>>();
  const urlQueryMap = new Map<string, QueryResult[]>();

  analyses.forEach(analysis => {
    if (analysis.queries && analysis.queries.length > 0) {
      urlQueryMap.set(analysis.url, analysis.queries);
      analysis.queries.forEach(query => {
        if (!allQueries.has(query.query)) {
          allQueries.set(query.query, new Set());
        }
        allQueries.get(query.query)!.add(analysis.url);
      });
    }
  });

  const baselineQueries = urlQueryMap.get(baseline.url) || [];
  
  // Find top queries, prioritizing those from baseline
  const topQueries = Array.from(allQueries.entries())
    .filter(([_, urls]) => urls.size > 1)
    .sort((a, b) => {
      // Prioritize baseline queries
      const aHasBaseline = allQueries.get(a[0])?.has(baseline.url) ? 1 : 0;
      const bHasBaseline = allQueries.get(b[0])?.has(baseline.url) ? 1 : 0;
      
      if (aHasBaseline !== bHasBaseline) {
        return bHasBaseline - aHasBaseline;
      }
      
      return b[1].size - a[1].size;
    })
    .slice(0, 15)
    .map(([query, urls]) => {
      const coverage = analyses.map(analysis => {
        const analysisQueries = urlQueryMap.get(analysis.url) || [];
        const queryResult = analysisQueries.find(q => q.query === query);
        
        return {
          url: analysis.url,
          hasContent: !!queryResult,
          coverageLevel: queryResult?.coverage || "No" as "Yes" | "Partial" | "No",
          isBaseline: analysis.url === baseline.url
        };
      });

      return { query, coverage };
    });

  // Find coverage gaps relative to baseline
  const coverageGaps = Array.from(allQueries.entries())
    .map(([query, urls]) => {
      const baselineHas = urls.has(baseline.url);
      const missingFrom = analyses
        .filter(analysis => !urls.has(analysis.url))
        .map(analysis => analysis.url);
      
      return { query, missingFrom, baselineHas };
    })
    .filter(gap => gap.missingFrom.length > 0 && gap.missingFrom.length < analyses.length)
    .slice(0, 10);

  // Find competitor advantages (what they have that baseline doesn't)
  const competitorAdvantages = competitors.map(competitor => {
    const competitorQueries = urlQueryMap.get(competitor.url) || [];
    const baselineQuerySet = new Set(baselineQueries.map(q => q.query));
    
    const uniqueQueries = competitorQueries
      .filter(query => !baselineQuerySet.has(query.query))
      .map(query => query.query)
      .slice(0, 5);

    const betterCoverage = competitorQueries
      .filter(query => {
        const baselineQuery = baselineQueries.find(bq => bq.query === query.query);
        if (!baselineQuery) return false;
        
        const coverageOrder = { "Yes": 3, "Partial": 2, "No": 1 };
        return coverageOrder[query.coverage] > coverageOrder[baselineQuery.coverage];
      })
      .map(query => query.query)
      .slice(0, 3);

    return {
      url: competitor.url,
      uniqueQueries,
      betterCoverage
    };
  }).filter(advantage => advantage.uniqueQueries.length > 0 || advantage.betterCoverage.length > 0);

  // Find baseline advantages (what baseline has that competitors don't)
  const baselineAdvantages = baselineQueries
    .filter(query => {
      const urlsWithQuery = allQueries.get(query.query);
      return urlsWithQuery && urlsWithQuery.size === 1 && urlsWithQuery.has(baseline.url);
    })
    .map(query => ({
      query: query.query,
      description: query.description || `Unique coverage: ${query.query}`
    }))
    .slice(0, 5);

  return {
    baselineUrl: baseline.url,
    baselineTitle: baseline.title ?? null,
    topQueries,
    coverageGaps,
    competitorAdvantages,
    baselineAdvantages
  };
}

export function generateComparisonSummary(analyses: AnalysisResponse[], comparisonData: ComparisonAnalysis): string {
  const urlCount = analyses.length;
  const totalQueries = comparisonData.topQueries.length;
  const gapCount = comparisonData.coverageGaps.length;
  const baselineDomain = new URL(comparisonData.baselineUrl).hostname;
  
  let summary = `Comparison of ${baselineDomain} against ${urlCount - 1} competitors reveals ${totalQueries} key query patterns.`;
  
  if (comparisonData.baselineAdvantages.length > 0) {
    summary += ` ${baselineDomain} has ${comparisonData.baselineAdvantages.length} unique content advantages.`;
  }
  
  if (gapCount > 0) {
    summary += ` Found ${gapCount} potential improvement areas where competitors have different coverage.`;
  }

  const strongestCompetitor = comparisonData.competitorAdvantages
    .sort((a, b) => (b.uniqueQueries.length + b.betterCoverage.length) - (a.uniqueQueries.length + a.betterCoverage.length))[0];
  
  if (strongestCompetitor) {
    const domain = new URL(strongestCompetitor.url).hostname;
    const advantages = strongestCompetitor.uniqueQueries.length + strongestCompetitor.betterCoverage.length;
    summary += ` ${domain} shows ${advantages} areas where they outperform the baseline.`;
  }

  return summary;
}