import { Settings, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';
import { PreprocessingConfig } from '../utils/preprocessing';
import { validatePreprocessing } from '../utils/validation';
import { ColumnInfo } from '../lib/supabase';

interface PreprocessingPanelProps {
  data: Record<string, any>[];
  columnInfo: ColumnInfo[];
  onPreprocess: (config: PreprocessingConfig) => void;
  isProcessing: boolean;
}

export default function PreprocessingPanel({ data, columnInfo, onPreprocess, isProcessing }: PreprocessingPanelProps) {
  const [config, setConfig] = useState<PreprocessingConfig>({
    normalization: 'none',
    handleMissing: 'mean',
    encodeCategories: true,
    removeOutliers: false,
  });

  const validation = validatePreprocessing(data, columnInfo, config);

  const handleSubmit = () => {
    if (!validation.isValid) {
      alert(`Error: ${validation.errors.join(', ')}`);
      return;
    }
    onPreprocess(config);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Preprocessing</h2>
          <p className="text-sm text-gray-500">Prepare your data for modeling</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Normalization Method
            </label>
            <select
              value={config.normalization}
              onChange={(e) => setConfig({ ...config, normalization: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isProcessing}
            >
              <option value="none">None</option>
              <option value="minmax">Min-Max Scaling (0-1)</option>
              <option value="zscore">Z-Score Standardization</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {config.normalization === 'minmax' && 'Scales values to range [0, 1]'}
              {config.normalization === 'zscore' && 'Centers data with mean=0, std=1'}
              {config.normalization === 'none' && 'Keep original values'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Handle Missing Values
            </label>
            <select
              value={config.handleMissing}
              onChange={(e) => setConfig({ ...config, handleMissing: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isProcessing}
            >
              <option value="remove">Remove rows</option>
              <option value="mean">Fill with mean</option>
              <option value="median">Fill with median</option>
              <option value="mode">Fill with mode</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {config.handleMissing === 'remove' && 'Delete rows with any missing values'}
              {config.handleMissing === 'mean' && 'Replace with column average'}
              {config.handleMissing === 'median' && 'Replace with column median'}
              {config.handleMissing === 'mode' && 'Replace with most frequent value'}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="encodeCategories"
              checked={config.encodeCategories}
              onChange={(e) => setConfig({ ...config, encodeCategories: e.target.checked })}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              disabled={isProcessing}
            />
            <div className="flex-1">
              <label htmlFor="encodeCategories" className="block text-sm font-semibold text-gray-700">
                Encode Categorical Features
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Convert text categories to numeric values for ML models
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="removeOutliers"
              checked={config.removeOutliers}
              onChange={(e) => setConfig({ ...config, removeOutliers: e.target.checked })}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              disabled={isProcessing}
            />
            <div className="flex-1">
              <label htmlFor="removeOutliers" className="block text-sm font-semibold text-gray-700">
                Remove Outliers
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Filter out statistical outliers using IQR method
              </p>
            </div>
          </div>
        </div>

        {(validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
          <div className="mt-6 space-y-3">
            {validation.errors.map((error, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            ))}
            {validation.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">{warning}</p>
              </div>
            ))}
            {validation.suggestions.map((suggestion, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">{suggestion}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !validation.isValid}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Apply Preprocessing
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
