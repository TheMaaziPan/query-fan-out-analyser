import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QueryResult } from "@shared/schema";

interface QueryCoverageProps {
  queries: QueryResult[];
}

export default function QueryCoverage({ queries }: QueryCoverageProps) {
  const getCoverageColor = (coverage: string) => {
    switch (coverage) {
      case 'Yes':
        return 'bg-green-100 text-green-800';
      case 'Partial':
        return 'bg-orange-100 text-orange-800';
      case 'No':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCoverageIcon = (coverage: string) => {
    switch (coverage) {
      case 'Yes':
        return '●';
      case 'Partial':
        return '●';
      case 'No':
        return '●';
      default:
        return '●';
    }
  };

  const getCoverageIconColor = (coverage: string) => {
    switch (coverage) {
      case 'Yes':
        return 'text-green-500';
      case 'Partial':
        return 'text-orange-500';
      case 'No':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Query Coverage Analysis</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-gray-600">Covered</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span className="text-gray-600">Partial</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-gray-600">Missing</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {queries.map((query, index) => (
            <div 
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-gray-900 font-medium mb-1">{query.query}</p>
                  <p className="text-sm text-gray-600">{query.description}</p>
                </div>
                <Badge className={getCoverageColor(query.coverage)}>
                  {query.coverage}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
