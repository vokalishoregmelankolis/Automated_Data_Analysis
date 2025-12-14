export interface PreprocessingConfig {
  normalization: 'none' | 'minmax' | 'zscore';
  handleMissing: 'remove' | 'mean' | 'median' | 'mode';
  encodeCategories: boolean;
  removeOutliers: boolean;
}

export interface PreprocessedData {
  data: Record<string, any>[];
  encodings: Record<string, Record<string, number>>;
  scalingParams: Record<string, { min: number; max: number; mean: number; std: number }>;
  removedRows: number;
}

export function preprocessData(
  data: Record<string, any>[],
  config: PreprocessingConfig
): PreprocessedData {
  let processedData = [...data];
  const encodings: Record<string, Record<string, number>> = {};
  const scalingParams: Record<string, { min: number; max: number; mean: number; std: number }> = {};
  let removedRows = 0;

  const columns = Object.keys(processedData[0] || {});
  const numericColumns: string[] = [];
  const stringColumns: string[] = [];

  columns.forEach(col => {
    const sample = processedData.find(row => row[col] !== null && row[col] !== undefined);
    if (sample && !isNaN(Number(sample[col]))) {
      numericColumns.push(col);
    } else {
      stringColumns.push(col);
    }
  });

  if (config.handleMissing === 'remove') {
    const originalLength = processedData.length;
    processedData = processedData.filter(row => {
      return columns.every(col => row[col] !== null && row[col] !== undefined && row[col] !== '');
    });
    removedRows = originalLength - processedData.length;
  } else {
    processedData = handleMissingValues(processedData, numericColumns, stringColumns, config.handleMissing);
  }

  if (config.removeOutliers) {
    const originalLength = processedData.length;
    processedData = removeOutliersFromData(processedData, numericColumns);
    removedRows += originalLength - processedData.length;
  }

  if (config.encodeCategories) {
    const result = encodeCategorialFeatures(processedData, stringColumns);
    processedData = result.data;
    Object.assign(encodings, result.encodings);
  }

  if (config.normalization !== 'none') {
    const result = normalizeNumericFeatures(processedData, numericColumns, config.normalization);
    processedData = result.data;
    Object.assign(scalingParams, result.params);
  }

  return { data: processedData, encodings, scalingParams, removedRows };
}

function handleMissingValues(
  data: Record<string, any>[],
  numericColumns: string[],
  stringColumns: string[],
  method: 'mean' | 'median' | 'mode'
): Record<string, any>[] {
  const result = data.map(row => ({ ...row }));

  numericColumns.forEach(col => {
    const values = data.map(row => Number(row[col])).filter(v => !isNaN(v) && v !== null);

    if (values.length === 0) return;

    let fillValue: number;
    if (method === 'mean') {
      fillValue = values.reduce((a, b) => a + b, 0) / values.length;
    } else if (method === 'median') {
      const sorted = [...values].sort((a, b) => a - b);
      fillValue = sorted[Math.floor(sorted.length / 2)];
    } else {
      fillValue = mode(values);
    }

    result.forEach(row => {
      if (row[col] === null || row[col] === undefined || row[col] === '' || isNaN(Number(row[col]))) {
        row[col] = fillValue;
      }
    });
  });

  stringColumns.forEach(col => {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length === 0) return;

    const fillValue = mode(values);
    result.forEach(row => {
      if (row[col] === null || row[col] === undefined || row[col] === '') {
        row[col] = fillValue;
      }
    });
  });

  return result;
}

function mode(values: any[]): any {
  const counts = new Map<any, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  let maxCount = 0;
  let modeValue = values[0];
  counts.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      modeValue = value;
    }
  });
  return modeValue;
}

function removeOutliersFromData(data: Record<string, any>[], numericColumns: string[]): Record<string, any>[] {
  return data.filter(row => {
    return numericColumns.every(col => {
      const value = Number(row[col]);
      if (isNaN(value)) return true;

      const allValues = data.map(r => Number(r[col])).filter(v => !isNaN(v));
      const sorted = [...allValues].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      return value >= lowerBound && value <= upperBound;
    });
  });
}

function encodeCategorialFeatures(
  data: Record<string, any>[],
  stringColumns: string[]
): { data: Record<string, any>[]; encodings: Record<string, Record<string, number>> } {
  const result = data.map(row => ({ ...row }));
  const encodings: Record<string, Record<string, number>> = {};

  stringColumns.forEach(col => {
    const uniqueValues = Array.from(new Set(data.map(row => row[col]).filter(v => v !== null && v !== undefined)));
    const encoding: Record<string, number> = {};

    uniqueValues.forEach((value, index) => {
      encoding[String(value)] = index;
    });

    encodings[col] = encoding;

    result.forEach(row => {
      if (row[col] !== null && row[col] !== undefined) {
        row[col] = encoding[String(row[col])] ?? 0;
      }
    });
  });

  return { data: result, encodings };
}

function normalizeNumericFeatures(
  data: Record<string, any>[],
  numericColumns: string[],
  method: 'minmax' | 'zscore'
): { data: Record<string, any>[]; params: Record<string, { min: number; max: number; mean: number; std: number }> } {
  const result = data.map(row => ({ ...row }));
  const params: Record<string, { min: number; max: number; mean: number; std: number }> = {};

  numericColumns.forEach(col => {
    const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
    if (values.length === 0) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    params[col] = { min, max, mean, std };

    result.forEach(row => {
      const value = Number(row[col]);
      if (isNaN(value)) return;

      if (method === 'minmax') {
        row[col] = max > min ? (value - min) / (max - min) : 0;
      } else {
        row[col] = std > 0 ? (value - mean) / std : 0;
      }
    });
  });

  return { data: result, params };
}
