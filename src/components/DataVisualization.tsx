import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { ColumnInfo, ColumnStats } from '../lib/supabase';

interface DataVisualizationProps {
  data: Record<string, any>[];
  columnInfo: ColumnInfo[];
  statistics: Record<string, ColumnStats>;
}

export default function DataVisualization({ data, columnInfo, statistics }: DataVisualizationProps) {
  const numericColumns = columnInfo.filter(c => c.type === 'number');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Data Visualizations</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {numericColumns.slice(0, 4).map((column) => {
          const stats = statistics[column.name];
          if (!stats || stats.min === undefined || stats.max === undefined) return null;

          const values = data
            .map(row => Number(row[column.name]))
            .filter(v => !isNaN(v));

          const bins = createHistogram(values, 10);

          return (
            <div key={column.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">{column.name}</h3>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>

              <div className="space-y-4">
                <div className="h-40 flex items-end gap-1">
                  {bins.map((bin, index) => {
                    const height = (bin.count / Math.max(...bins.map(b => b.count))) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t transition-all hover:opacity-80"
                        style={{ height: `${height}%` }}
                        title={`${bin.range}: ${bin.count} values`}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Mean</p>
                    <p className="font-semibold text-gray-800">{stats.mean?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Median</p>
                    <p className="font-semibold text-gray-800">{stats.median?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Min</p>
                    <p className="font-semibold text-gray-800">{stats.min.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max</p>
                    <p className="font-semibold text-gray-800">{stats.max.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {numericColumns.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No numeric columns available for visualization</p>
        </div>
      )}
    </div>
  );
}

function createHistogram(values: number[], binCount: number) {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
    count: 0,
  }));

  values.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
    bins[binIndex].count++;
  });

  return bins;
}
