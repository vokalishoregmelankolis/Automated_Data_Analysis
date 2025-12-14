import { ColumnInfo, ColumnStats, Insight } from '../lib/supabase';

export function detectColumnType(values: any[]): 'number' | 'string' | 'date' | 'boolean' {
  const sampleSize = Math.min(100, values.length);
  let numberCount = 0;
  let dateCount = 0;
  let booleanCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const val = values[i];
    if (val === null || val === undefined || val === '') continue;

    if (typeof val === 'boolean' || val === 'true' || val === 'false') {
      booleanCount++;
    } else if (!isNaN(Number(val)) && val !== '') {
      numberCount++;
    } else if (!isNaN(Date.parse(String(val)))) {
      dateCount++;
    }
  }

  if (booleanCount > sampleSize * 0.8) return 'boolean';
  if (numberCount > sampleSize * 0.8) return 'number';
  if (dateCount > sampleSize * 0.8) return 'date';
  return 'string';
}

export function analyzeColumn(columnName: string, values: any[], type: string): ColumnStats {
  const validValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const count = values.length;
  const nullCount = count - validValues.length;
  const uniqueCount = new Set(validValues).size;

  const stats: ColumnStats = {
    count,
    nullCount,
    uniqueCount,
  };

  if (type === 'number') {
    const numbers = validValues.map(v => Number(v)).filter(n => !isNaN(n));
    if (numbers.length > 0) {
      numbers.sort((a, b) => a - b);

      stats.min = numbers[0];
      stats.max = numbers[numbers.length - 1];
      stats.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      stats.median = numbers[Math.floor(numbers.length / 2)];

      const q1 = numbers[Math.floor(numbers.length * 0.25)];
      const q2 = stats.median;
      const q3 = numbers[Math.floor(numbers.length * 0.75)];
      stats.quartiles = [q1, q2, q3];

      const variance = numbers.reduce((sum, val) => sum + Math.pow(val - stats.mean!, 2), 0) / numbers.length;
      stats.stdDev = Math.sqrt(variance);
    }
  }

  const modeMap = new Map<any, number>();
  validValues.forEach(v => {
    modeMap.set(v, (modeMap.get(v) || 0) + 1);
  });
  let maxCount = 0;
  let mode: any = null;
  modeMap.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  });
  stats.mode = mode;

  return stats;
}

export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

export function detectOutliers(values: number[]): { count: number; indices: number[] } {
  if (values.length < 4) return { count: 0, indices: [] };

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outlierIndices = values
    .map((v, i) => (v < lowerBound || v > upperBound ? i : -1))
    .filter(i => i !== -1);

  return { count: outlierIndices.length, indices: outlierIndices };
}

export function detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 3) return 'stable';

  let increases = 0;
  let decreases = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) increases++;
    else if (values[i] < values[i - 1]) decreases++;
  }

  const threshold = values.length * 0.6;
  if (increases > threshold) return 'increasing';
  if (decreases > threshold) return 'decreasing';
  return 'stable';
}

export function generateInsights(
  data: Record<string, any>[],
  columnInfo: ColumnInfo[],
  statistics: Record<string, ColumnStats>
): Insight[] {
  const insights: Insight[] = [];

  const numericColumns = columnInfo.filter(c => c.type === 'number');
  const dataQualityScore = calculateDataQuality(data, columnInfo, statistics);

  insights.push({
    type: 'summary',
    title: 'Intelligent Dataset Analysis',
    description: `Analyzed ${data.length} records with ${columnInfo.length} features. Data quality score: ${dataQualityScore}%. Found ${numericColumns.length} numeric features for advanced analysis.`,
    severity: dataQualityScore > 80 ? 'low' : dataQualityScore > 60 ? 'medium' : 'high',
  });

  numericColumns.forEach(col => {
    const stats = statistics[col.name];
    if (!stats) return;

    const values = data.map(row => Number(row[col.name])).filter(v => !isNaN(v));

    if (values.length > 0) {
      const outliers = detectOutliers(values);
      if (outliers.count > 0) {
        const percentage = ((outliers.count / values.length) * 100).toFixed(1);
        insights.push({
          type: 'outlier',
          title: `Anomalies Detected in ${col.name}`,
          description: `Found ${outliers.count} outliers (${percentage}% of data). These unusual values may indicate errors or significant events that need investigation.`,
          severity: outliers.count > values.length * 0.1 ? 'high' : 'medium',
        });
      }

      const trend = detectTrend(values);
      if (trend !== 'stable') {
        insights.push({
          type: 'trend',
          title: `${trend === 'increasing' ? 'Upward' : 'Downward'} Trend in ${col.name}`,
          description: `The data shows a clear ${trend} pattern. ${
            trend === 'increasing'
              ? 'Values are growing over time, suggesting positive momentum.'
              : 'Values are declining, which may require attention.'
          }`,
          severity: 'medium',
        });
      }

      if (stats.stdDev && stats.mean) {
        const cv = (stats.stdDev / stats.mean) * 100;
        if (cv > 75) {
          insights.push({
            type: 'trend',
            title: `Extreme Variability in ${col.name}`,
            description: `This feature shows very high variance (CV: ${cv.toFixed(1)}%). Consider normalization or investigating the cause of such wide dispersion.`,
            severity: 'high',
          });
        } else if (cv < 5) {
          insights.push({
            type: 'trend',
            title: `Low Variability in ${col.name}`,
            description: `Values are highly consistent (CV: ${cv.toFixed(1)}%). This feature may have limited predictive power.`,
            severity: 'low',
          });
        }
      }
    }

    if (stats.nullCount > data.length * 0.2) {
      insights.push({
        type: 'outlier',
        title: `Significant Missing Data in ${col.name}`,
        description: `${((stats.nullCount / data.length) * 100).toFixed(1)}% of values are missing. Consider imputation strategies or investigate why data is incomplete.`,
        severity: 'high',
      });
    }

    if (stats.uniqueCount === data.length) {
      insights.push({
        type: 'summary',
        title: `${col.name} Contains Unique Values`,
        description: `Every row has a distinct value. This might be an ID field or contain highly granular data.`,
        severity: 'low',
      });
    }
  });

  if (numericColumns.length >= 2) {
    const correlations = findCorrelations(data, numericColumns);
    correlations.forEach(corr => {
      const strength = Math.abs(corr.value);
      if (strength > 0.7) {
        insights.push({
          type: 'correlation',
          title: `Strong ${corr.value > 0 ? 'Positive' : 'Negative'} Correlation Found`,
          description: `"${corr.col1}" and "${corr.col2}" are ${
            corr.value > 0 ? 'strongly related' : 'inversely related'
          } (r = ${corr.value.toFixed(2)}). ${
            corr.value > 0
              ? 'As one increases, the other tends to increase.'
              : 'As one increases, the other tends to decrease.'
          }`,
          severity: strength > 0.9 ? 'high' : 'medium',
        });
      }
    });
  }

  const stringColumns = columnInfo.filter(c => c.type === 'string');
  stringColumns.forEach(col => {
    const stats = statistics[col.name];
    if (stats.uniqueCount < data.length * 0.05) {
      insights.push({
        type: 'summary',
        title: `${col.name} Has Few Categories`,
        description: `Only ${stats.uniqueCount} unique values found. This categorical field could be useful for grouping and segmentation analysis.`,
        severity: 'low',
      });
    }
  });

  return insights;
}

function calculateDataQuality(
  data: Record<string, any>[],
  columnInfo: ColumnInfo[],
  statistics: Record<string, ColumnStats>
): number {
  let totalCells = data.length * columnInfo.length;
  let missingCells = 0;

  columnInfo.forEach(col => {
    missingCells += statistics[col.name].nullCount;
  });

  return Math.round(((totalCells - missingCells) / totalCells) * 100);
}

function findCorrelations(
  data: Record<string, any>[],
  numericColumns: ColumnInfo[]
): Array<{ col1: string; col2: string; value: number }> {
  const correlations: Array<{ col1: string; col2: string; value: number }> = [];

  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i].name;
      const col2 = numericColumns[j].name;

      const values1 = data.map(row => Number(row[col1])).filter(v => !isNaN(v));
      const values2 = data.map(row => Number(row[col2])).filter(v => !isNaN(v));

      if (values1.length > 2 && values2.length > 2) {
        const correlation = calculateCorrelation(values1, values2);
        if (Math.abs(correlation) > 0.5) {
          correlations.push({ col1, col2, value: correlation });
        }
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export function parseCSV(csvText: string): Record<string, any>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));

  return result;
}
