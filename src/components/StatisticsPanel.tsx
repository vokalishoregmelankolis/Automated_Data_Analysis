import { BarChart2, Database, Layers, Hash } from 'lucide-react';
import { ColumnInfo, ColumnStats } from '../lib/supabase';

interface StatisticsPanelProps {
  data: Record<string, any>[];
  columnInfo: ColumnInfo[];
  statistics: Record<string, ColumnStats>;
}

export default function StatisticsPanel({ data, columnInfo, statistics }: StatisticsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Statistical Summary</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">{data.length}</p>
          <p className="text-sm opacity-90">Total Rows</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Layers className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">{columnInfo.length}</p>
          <p className="text-sm opacity-90">Columns</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Hash className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">
            {columnInfo.filter(c => c.type === 'number').length}
          </p>
          <p className="text-sm opacity-90">Numeric Columns</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <BarChart2 className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">
            {columnInfo.filter(c => c.type === 'string').length}
          </p>
          <p className="text-sm opacity-90">Text Columns</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Column
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Unique
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Missing
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {columnInfo.map((column) => {
                const stats = statistics[column.name];
                return (
                  <tr key={column.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {column.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        column.type === 'number'
                          ? 'bg-blue-100 text-blue-700'
                          : column.type === 'string'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {column.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stats.count}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{stats.uniqueCount}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {stats.nullCount > 0 ? (
                        <span className="text-amber-600 font-medium">{stats.nullCount}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
