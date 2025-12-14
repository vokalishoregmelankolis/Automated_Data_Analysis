import { Sparkles, TrendingUp, Filter, Layers } from 'lucide-react';
import { ColumnInfo, ColumnStats } from '../lib/supabase';

interface RecommendationsProps {
  data: Record<string, any>[];
  columnInfo: ColumnInfo[];
  statistics: Record<string, ColumnStats>;
}

interface Recommendation {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export default function Recommendations({ data, columnInfo, statistics }: RecommendationsProps) {
  const recommendations = generateRecommendations(data, columnInfo, statistics);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'from-rose-500 to-pink-600';
      case 'medium':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-50 border-rose-200';
      case 'medium':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Smart Recommendations</h2>
          <p className="text-sm text-gray-500">Next steps for deeper analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <div
              key={index}
              className={`rounded-xl border p-5 transition-all hover:shadow-lg ${getPriorityBg(rec.priority)}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getPriorityColor(rec.priority)} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{rec.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                    <Sparkles className="w-3 h-3" />
                    {rec.action}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function generateRecommendations(
  data: Record<string, any>[],
  columnInfo: ColumnInfo[],
  statistics: Record<string, ColumnStats>
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const numericColumns = columnInfo.filter(c => c.type === 'number');
  const stringColumns = columnInfo.filter(c => c.type === 'string');

  if (numericColumns.length >= 2) {
    recommendations.push({
      icon: TrendingUp,
      title: 'Perform Correlation Analysis',
      description: `You have ${numericColumns.length} numeric features. Analyze relationships between variables to discover hidden patterns and dependencies.`,
      action: 'Explore correlations',
      priority: 'high',
    });
  }

  const missingDataCols = columnInfo.filter(col => statistics[col.name].nullCount > data.length * 0.1);
  if (missingDataCols.length > 0) {
    recommendations.push({
      icon: Filter,
      title: 'Address Missing Data',
      description: `${missingDataCols.length} feature${missingDataCols.length > 1 ? 's have' : ' has'} significant missing values. Consider imputation, removal, or investigating the root cause.`,
      action: 'Clean data',
      priority: 'high',
    });
  }

  const categoricalCols = stringColumns.filter(col => {
    const stats = statistics[col.name];
    return stats.uniqueCount > 1 && stats.uniqueCount <= 20;
  });

  if (categoricalCols.length > 0) {
    recommendations.push({
      icon: Layers,
      title: 'Segment by Categories',
      description: `${categoricalCols.length} categorical feature${categoricalCols.length > 1 ? 's are' : ' is'} perfect for grouping. Compare metrics across categories to find patterns.`,
      action: 'Create segments',
      priority: 'medium',
    });
  }

  const highVarianceCols = numericColumns.filter(col => {
    const stats = statistics[col.name];
    return stats.stdDev && stats.mean && (stats.stdDev / stats.mean) > 0.7;
  });

  if (highVarianceCols.length > 0) {
    recommendations.push({
      icon: TrendingUp,
      title: 'Normalize High Variance Features',
      description: `${highVarianceCols.length} feature${highVarianceCols.length > 1 ? 's show' : ' shows'} high variance. Normalization or scaling could improve analysis accuracy.`,
      action: 'Apply scaling',
      priority: 'medium',
    });
  }

  if (data.length > 1000) {
    recommendations.push({
      icon: Filter,
      title: 'Sample Large Dataset',
      description: 'With over 1,000 records, consider sampling for faster exploratory analysis before running comprehensive tests.',
      action: 'Create sample',
      priority: 'low',
    });
  }

  const possibleIdColumns = columnInfo.filter(col => {
    const stats = statistics[col.name];
    return stats.uniqueCount === data.length;
  });

  if (possibleIdColumns.length > 0) {
    recommendations.push({
      icon: Layers,
      title: 'Review Identifier Columns',
      description: `${possibleIdColumns.length} column${possibleIdColumns.length > 1 ? 's appear' : ' appears'} to contain unique IDs. These may not add analytical value and could be excluded.`,
      action: 'Review features',
      priority: 'low',
    });
  }

  if (numericColumns.length > 5) {
    recommendations.push({
      icon: TrendingUp,
      title: 'Consider Dimensionality Reduction',
      description: `With ${numericColumns.length} numeric features, techniques like PCA could help identify the most important dimensions.`,
      action: 'Reduce dimensions',
      priority: 'medium',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      icon: Sparkles,
      title: 'Dataset Ready for Analysis',
      description: 'Your data appears clean and well-structured. Proceed with your specific analysis objectives.',
      action: 'Continue analysis',
      priority: 'low',
    });
  }

  return recommendations;
}
