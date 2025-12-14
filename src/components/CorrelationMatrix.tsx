import { Network } from 'lucide-react';
import { ColumnInfo } from '../lib/supabase';
import { calculateCorrelation } from '../utils/dataAnalysis';

interface CorrelationMatrixProps {
  data: Record<string, any>[];
  columnInfo: ColumnInfo[];
}

export default function CorrelationMatrix({ data, columnInfo }: CorrelationMatrixProps) {
  const numericColumns = columnInfo.filter(c => c.type === 'number');

  if (numericColumns.length < 2) {
    return null;
  }

  const matrix = buildCorrelationMatrix(data, numericColumns);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Correlation Matrix</h2>
          <p className="text-sm text-gray-500">Relationships between numeric features</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${numericColumns.length}, 80px)` }}>
            <div></div>
            {numericColumns.map(col => (
              <div key={col.name} className="text-xs font-semibold text-gray-700 p-2 text-center truncate" title={col.name}>
                {col.name.length > 10 ? col.name.substring(0, 8) + '...' : col.name}
              </div>
            ))}

            {numericColumns.map((rowCol, rowIndex) => (
              <>
                <div className="text-xs font-semibold text-gray-700 p-2 truncate flex items-center" title={rowCol.name}>
                  {rowCol.name.length > 15 ? rowCol.name.substring(0, 13) + '...' : rowCol.name}
                </div>
                {numericColumns.map((colCol, colIndex) => {
                  const correlation = matrix[rowIndex][colIndex];
                  const absCorr = Math.abs(correlation);
                  const color = getCorrelationColor(correlation);
                  const bgOpacity = absCorr;

                  return (
                    <div
                      key={`${rowCol.name}-${colCol.name}`}
                      className="p-2 text-center rounded transition-all hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: `${color}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
                      }}
                      title={`${rowCol.name} vs ${colCol.name}: ${correlation.toFixed(3)}`}
                    >
                      <span className="text-xs font-semibold text-gray-800">
                        {correlation.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-xs text-gray-600">Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200"></div>
            <span className="text-xs text-gray-600">No correlation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-xs text-gray-600">Positive</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-800">
            <strong>How to read:</strong> Values closer to 1 or -1 indicate stronger relationships.
            Positive (green) means variables move together, negative (red) means they move in opposite directions.
          </p>
        </div>
      </div>
    </div>
  );
}

function buildCorrelationMatrix(data: Record<string, any>[], numericColumns: ColumnInfo[]): number[][] {
  const matrix: number[][] = [];

  for (let i = 0; i < numericColumns.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < numericColumns.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const values1 = data.map(row => Number(row[numericColumns[i].name])).filter(v => !isNaN(v));
        const values2 = data.map(row => Number(row[numericColumns[j].name])).filter(v => !isNaN(v));
        matrix[i][j] = calculateCorrelation(values1, values2);
      }
    }
  }

  return matrix;
}

function getCorrelationColor(correlation: number): string {
  if (correlation > 0) {
    return '#22c55e';
  } else if (correlation < 0) {
    return '#ef4444';
  }
  return '#e5e7eb';
}
