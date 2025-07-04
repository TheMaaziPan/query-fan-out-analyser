import type { AnalysisResponse, QueryResult, ComparisonResponse } from "@shared/schema";

export interface ComparisonAnalysis {
  topQueries: Array<{
    query: string;
    coverage: Array<{
      url: string;
      hasContent: boolean;
      coverageLevel: "Yes" | "Partial" | "No";
    }>;
  }>;
  coverageGaps: Array<{
    query: string;
    missingFrom: string[];
  }>;
  strengths: Array<{
    url: string;
    uniqueQueries: string[];
  }>;
}

export function performComparisonAnalysis(analyses: AnalysisResponse[]): ComparisonAnalysis {
  if (analyses.length < 2) {
    throw new Error("At least two analyses are required for comparison");
  }

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

  // Find top queries (queries that appear in multiple analyses)
  const topQueries = Array.from(allQueries.entries())
    .filter(([_, urls]) => urls.size > 1)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10)
    .map(([query, urls]) => {
      const coverage = analyses.map(analysis => {
        const analysisQueries = urlQueryMap.get(analysis.url) || [];
        const queryResult = analysisQueries.find(q => q.query === query);
        
        return {
          url: analysis.url,
          hasContent: !!queryResult,
          coverageLevel: queryResult?.coverage || "No" as "Yes" | "Partial" | "No"
        };
      });

      return { query, coverage };
    });

  // Find coverage gaps (queries missing from some URLs)
  const coverageGaps = Array.from(allQueries.entries())
    .map(([query, urls]) => {
      const missingFrom = analyses
        .filter(analysis => !urls.has(analysis.url))
        .map(analysis => analysis.url);
      
      return { query, missingFrom };
    })
    .filter(gap => gap.missingFrom.length > 0 && gap.missingFrom.length < analyses.length)
    .slice(0, 10);

  // Find unique strengths (queries only in one URL)
  const strengths = analyses.map(analysis => {
    const analysisQueries = urlQueryMap.get(analysis.url) || [];
    const uniqueQueries = analysisQueries
      .filter(query => {
        const urlsWithQuery = allQueries.get(query.query);
        return urlsWithQuery && urlsWithQuery.size === 1;
      })
      .map(query => query.query)
      .slice(0, 5); // Limit to top 5 unique queries per URL

    return {
      url: analysis.url,
      uniqueQueries
    };
  }).filter(strength => strength.uniqueQueries.length > 0);

  return {
    topQueries,
    coverageGaps,
    strengths
  };
}

export function generateComparisonSummary(analyses: AnalysisResponse[], comparisonData: ComparisonAnalysis): string {
  const urlCount = analyses.length;
  const totalQueries = comparisonData.topQueries.length;
  const gapCount = comparisonData.coverageGaps.length;
  
  let summary = `Comparison of ${urlCount} competitors reveals ${totalQueries} common query patterns.`;
  
  if (gapCount > 0) {
    summary += ` Found ${gapCount} coverage gaps where content is missing from some competitors.`;
  }

  const strongestCompetitor = comparisonData.strengths
    .sort((a, b) => b.uniqueQueries.length - a.uniqueQueries.length)[0];
  
  if (strongestCompetitor) {
    const domain = new URL(strongestCompetitor.url).hostname;
    summary += ` ${domain} shows the strongest unique content coverage.`;
  }

  return summary;
}