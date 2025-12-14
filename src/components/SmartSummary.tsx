import { Brain, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { ColumnInfo, ColumnStats } from '../lib/supabase';

interface SmartSummaryProps {
  data: Record<string, any>[];
  columnInfo: ColumnInfo[];
  statistics: Record<string, ColumnStats>;
}

export default function SmartSummary({ data, columnInfo, statistics }: SmartSummaryProps) {
  const numericColumns = columnInfo.filter(c => c.type === 'number');
  const stringColumns = columnInfo.filter(c => c.type === 'string');

  const dataQuality = calculateDataQuality(data, columnInfo, statistics);
  const completeness = calculateCompleteness(columnInfo, statistics);
  const keyFindings = generateKeyFindings(data, columnInfo, statistics);

  return (
    <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Intelligent Analysis Summary</h2>
          <p className="text-blue-100">Context-aware insights from your data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-300" />
            <p className="text-sm font-medium text-blue-100">Data Quality</p>
          </div>
          <p className="text-3xl font-bold mb-1">{dataQuality}%</p>
          <p className="text-xs text-blue-100">
            {dataQuality > 90 ? 'Excellent' : dataQuality > 70 ? 'Good' : 'Needs Improvement'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-amber-300" />
            <p className="text-sm font-medium text-blue-100">Completeness</p>
          </div>
          <p className="text-3xl font-bold mb-1">{completeness}%</p>
          <p className="text-xs text-blue-100">
            {completeness === 100 ? 'No missing values' : `${columnInfo.filter(c => statistics[c.name].nullCount > 0).length} columns with gaps`}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-purple-300" />
            <p className="text-sm font-medium text-blue-100">Complexity</p>
          </div>
          <p className="text-3xl font-bold mb-1">
            {numericColumns.length}/{columnInfo.length}
          </p>
          <p className="text-xs text-blue-100">Numeric features available</p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
        <h3 className="font-semibold text-lg mb-3">Key Findings</h3>
        <div className="space-y-2">
          {keyFindings.map((finding, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60 mt-2 flex-shrink-0" />
              <p className="text-sm leading-relaxed text-blue-50">{finding}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function calculateDataQuality(
  data: Record<string, any>[],
  columnInfo: ColumnInfo[],
  statistics: Record<string, ColumnStats>
): number {
  const totalCells = data.length * columnInfo.length;
  let missingCells = 0;

  columnInfo.forEach(col => {
    missingCells += statistics[col.name].nullCount;
  });

  return Math.round(((totalCells - missingCells) / totalCells) * 100);
}

function calculateCompleteness(columnInfo: ColumnInfo[], statistics: Record<string, ColumnStats>): number {
  const columnsWithData = columnInfo.filter(col => statistics[col.name].nullCount === 0).length;
  return Math.round((columnsWithData / columnInfo.length) * 100);
}

function generateKeyFindings(
  data: Record<string, any>[],
  columnInfo: ColumnInfo[],
  statistics: Record<string, ColumnStats>
): string[] {
  const findings: string[] = [];

  const numericColumns = columnInfo.filter(c => c.type === 'number');
  const stringColumns = columnInfo.filter(c => c.type === 'string');

  findings.push(
    `Dataset contains ${data.length.toLocaleString()} records across ${columnInfo.length} features, providing ${numericColumns.length > 0 ? 'rich' : 'limited'} quantitative data for analysis.`
  );

  if (numericColumns.length > 0) {
    const avgValues = numericColumns.map(col => {
      const values = data.map(row => Number(row[col.name])).filter(v => !isNaN(v));
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });
    const hasVariation = avgValues.some((avg, i) => {
      const stats = statistics[numericColumns[i].name];
      return stats.stdDev && stats.mean && (stats.stdDev / stats.mean) > 0.3;
    });

    if (hasVariation) {
      findings.push(
        'Numeric features show meaningful variation, indicating the data captures diverse scenarios and patterns worth exploring.'
      );
    }
  }

  const categoricalColumns = stringColumns.filter(col => {
    const stats = statistics[col.name];
    return stats.uniqueCount > 1 && stats.uniqueCount < data.length * 0.5;
  });

  if (categoricalColumns.length > 0) {
    findings.push(
      `Identified ${categoricalColumns.length} categorical feature${categoricalColumns.length > 1 ? 's' : ''} suitable for segmentation and group-based analysis.`
    );
  }

  const missingDataColumns = columnInfo.filter(col => statistics[col.name].nullCount > 0);
  if (missingDataColumns.length > 0) {
    const totalMissing = missingDataColumns.reduce((sum, col) => sum + statistics[col.name].nullCount, 0);
    const percentage = ((totalMissing / (data.length * columnInfo.length)) * 100).toFixed(1);
    findings.push(
      `${percentage}% of data points are missing across ${missingDataColumns.length} feature${missingDataColumns.length > 1 ? 's' : ''}. Consider data cleaning strategies.`
    );
  } else {
    findings.push('Complete dataset with no missing values, excellent foundation for reliable analysis.');
  }

  return findings;
}
