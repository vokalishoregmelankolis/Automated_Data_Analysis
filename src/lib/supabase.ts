import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Dataset {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>[];
  column_info: ColumnInfo[];
  row_count: number;
  created_at: string;
  updated_at: string;
}

export interface ColumnInfo {
  name: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  nullable: boolean;
}

export interface AnalysisResult {
  id: string;
  dataset_id: string;
  statistics: Record<string, ColumnStats>;
  insights: Insight[];
  created_at: string;
}

export interface ColumnStats {
  count: number;
  nullCount: number;
  uniqueCount: number;
  mean?: number;
  median?: number;
  mode?: any;
  stdDev?: number;
  min?: number;
  max?: number;
  quartiles?: [number, number, number];
}

export interface Insight {
  type: 'correlation' | 'outlier' | 'trend' | 'summary';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}
