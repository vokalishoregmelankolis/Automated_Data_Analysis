import { useState } from 'react';
import { BarChart2, Lightbulb, TrendingUp, Table, Network, Sparkles } from 'lucide-react';
import SmartSummary from './SmartSummary';
import InsightsPanel from './InsightsPanel';
import Recommendations from './Recommendations';
import CorrelationMatrix from './CorrelationMatrix';
import StatisticsPanel from './StatisticsPanel';
import DataVisualization from './DataVisualization';
import DataTable from './DataTable';
import { ColumnInfo, ColumnStats, Insight } from '../lib/supabase';

interface CompactAnalysisProps {
  data: Record<string, any>[];
  columnInfo: ColumnInfo[];
  statistics: Record<string, ColumnStats>;
  insights: Insight[];
}

type Tab = 'overview' | 'insights' | 'statistics' | 'visualizations' | 'correlations' | 'data';

export default function CompactAnalysis({ data, columnInfo, statistics, insights }: CompactAnalysisProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'overview', label: 'Overview', icon: Sparkles },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'statistics', label: 'Statistics', icon: BarChart2 },
    { id: 'visualizations', label: 'Charts', icon: TrendingUp },
    { id: 'correlations', label: 'Correlations', icon: Network },
    { id: 'data', label: 'Data Table', icon: Table },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-card overflow-hidden !p-0">
        <div className="flex border-b-2 border-slate-200 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-b-3 border-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <SmartSummary data={data} columnInfo={columnInfo} statistics={statistics} />
              <Recommendations data={data} columnInfo={columnInfo} statistics={statistics} />
            </div>
          )}

          {activeTab === 'insights' && (
            <InsightsPanel insights={insights} />
          )}

          {activeTab === 'statistics' && (
            <StatisticsPanel data={data} columnInfo={columnInfo} statistics={statistics} />
          )}

          {activeTab === 'visualizations' && (
            <DataVisualization data={data} columnInfo={columnInfo} statistics={statistics} />
          )}

          {activeTab === 'correlations' && (
            <CorrelationMatrix data={data} columnInfo={columnInfo} />
          )}

          {activeTab === 'data' && (
            <DataTable data={data} maxRows={100} />
          )}
        </div>
      </div>
    </div>
  );
}
