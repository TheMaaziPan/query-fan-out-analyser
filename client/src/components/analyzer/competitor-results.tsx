import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Users, AlertTriangle } from "lucide-react";
import type { ComparisonResponse } from "@shared/schema";

interface CompetitorResultsProps {
  comparisonId: string | null;
}

export default function CompetitorResults({ comparisonId }: CompetitorResultsProps) {
  const { data: comparison, isLoading } = useQuery<ComparisonResponse>({
    queryKey: ["/api/comparison/" + comparisonId],
    enabled: !!comparisonId,
    refetchInterval: 3000,
  });

  if (!comparisonId) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Competitor Comparison</h2>
          <p className="text-gray-600">Compare multiple competitor websites to identify content gaps and opportunities</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !comparison) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competitor comparison...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedAnalyses = comparison.analyses?.filter(a => a.status === 'completed').length || 0;
  const totalAnalyses = comparison.analyses?.length || 0;
  const progressPercentage = totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{comparison.name}</h2>
              {comparison.description && (
                <p className="text-gray-600 mt-1">{comparison.description}</p>
              )}
            </div>
            <div className="mt-4 sm:mt-0">
              <Badge className={getStatusColor(comparison.status)}>
                {comparison.status.charAt(0).toUpperCase() + comparison.status.slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analysis Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{completedAnalyses}/{totalAnalyses} completed</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{completedAnalyses}</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {comparison.analyses?.filter(a => a.status === 'pending' || a.status === 'processing').length || 0}
                </div>
                <div className="text-sm text-blue-600">In Progress</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {comparison.analyses?.filter(a => a.status === 'failed').length || 0}
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Analysis Status */}
      {comparison.analyses && comparison.analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Competitor Analysis Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comparison.analyses.map((analysis, index) => {
                const domain = new URL(analysis.url).hostname;
                return (
                  <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {analysis.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : analysis.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{domain}</div>
                        <div className="text-sm text-gray-500">{analysis.url}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getStatusColor(analysis.status)}>
                        {analysis.status}
                      </Badge>
                      {analysis.status === 'completed' && analysis.queryCoverage && (
                        <div className="text-sm text-gray-500 mt-1">{analysis.queryCoverage}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparison.status === 'completed' && comparison.comparisonData && (
        <>
          {/* Top Queries */}
          {comparison.comparisonData.topQueries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Query Coverage Comparison</CardTitle>
                <p className="text-sm text-gray-600">
                  How your site compares to competitors for key search queries
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparison.comparisonData.topQueries.map((queryData, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{queryData.query}</h4>
                      <div className="grid gap-2">
                        {queryData.coverage.map((coverage, idx) => {
                          const domain = new URL(coverage.url).hostname;
                          return (
                            <div key={idx} className={`flex items-center justify-between p-2 rounded ${coverage.isBaseline ? 'bg-blue-50 border border-blue-200' : ''}`}>
                              <span className={`text-sm ${coverage.isBaseline ? 'font-medium text-blue-900' : 'text-gray-600'}`}>
                                {coverage.isBaseline ? '📍 ' : ''}{domain}{coverage.isBaseline ? ' (Your Site)' : ''}
                              </span>
                              <Badge 
                                variant={coverage.coverageLevel === 'Yes' ? 'default' : 
                                        coverage.coverageLevel === 'Partial' ? 'secondary' : 'destructive'}
                              >
                                {coverage.coverageLevel}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coverage Gaps */}
          {comparison.comparisonData.coverageGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Content Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparison.comparisonData.coverageGaps.map((gap, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-orange-50">
                      <h4 className="font-medium text-gray-900 mb-2">{gap.query}</h4>
                      <div className="text-sm text-gray-600">
                        Missing from: {gap.missingFrom.map(url => new URL(url).hostname).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Baseline Advantages */}
          {comparison.comparisonData.baselineAdvantages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Your Unique Advantages
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Content areas where your site outperforms competitors
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparison.comparisonData.baselineAdvantages.map((advantage, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-gray-900 mb-1">{advantage.query}</h4>
                      <p className="text-sm text-gray-600">{advantage.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitor Advantages */}
          {comparison.comparisonData.competitorAdvantages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Competitor Advantages
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Areas where competitors outperform your site
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparison.comparisonData.competitorAdvantages.map((advantage, index) => {
                    const domain = new URL(advantage.url).hostname;
                    return (
                      <div key={index} className="border rounded-lg p-4 bg-orange-50">
                        <h4 className="font-medium text-gray-900 mb-2">{domain}</h4>
                        
                        {advantage.uniqueQueries.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Unique Content:</p>
                            <div className="flex flex-wrap gap-2">
                              {advantage.uniqueQueries.map((query, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-orange-300">
                                  {query}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {advantage.betterCoverage.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Better Coverage:</p>
                            <div className="flex flex-wrap gap-2">
                              {advantage.betterCoverage.map((query, idx) => (
                                <Badge key={idx} variant="destructive" className="text-xs">
                                  {query}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}