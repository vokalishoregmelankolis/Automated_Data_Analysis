import { Brain, Play, TrendingUp, Zap, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';
import { ModelType, ModelConfig, TrainingResult } from '../utils/modeling';
import { ColumnInfo } from '../lib/supabase';
import { validateModeling, getModelDescription } from '../utils/validation';

interface ModelTrainingProps {
  data: Record<string, any>[];
  columnInfo: ColumnInfo[];
  onTrain: (config: ModelConfig, onProgress: (progress: number) => void) => Promise<TrainingResult>;
}

export default function ModelTraining({ data, columnInfo, onTrain }: ModelTrainingProps) {
  const numericColumns = columnInfo.filter(c => c.type === 'number');

  const [modelType, setModelType] = useState<ModelType>('linear_regression');
  const [targetColumn, setTargetColumn] = useState(numericColumns[0]?.name || '');
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [testSize, setTestSize] = useState(0.2);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TrainingResult | null>(null);

  const validation = validateModeling(data, columnInfo, modelType, targetColumn, featureColumns);

  const handleFeatureToggle = (column: string) => {
    if (featureColumns.includes(column)) {
      setFeatureColumns(featureColumns.filter(c => c !== column));
    } else {
      setFeatureColumns([...featureColumns, column]);
    }
  };

  const handleTrain = async () => {
    if (!validation.isValid) {
      alert(`Error: ${validation.errors.join(', ')}`);
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setResult(null);

    try {
      const config: ModelConfig = {
        type: modelType,
        targetColumn,
        featureColumns,
        testSize,
        randomSeed: 42,
      };

      const trainingResult = await onTrain(config, setProgress);
      setResult(trainingResult);
    } catch (error) {
      console.error('Training error:', error);
      alert('Training failed. Please check your data and configuration.');
    } finally {
      setIsTraining(false);
    }
  };

  const allModels: ModelType[] = [
    'linear_regression',
    'logistic_regression',
    'decision_tree',
    'random_forest',
    'gradient_boosting',
    'xgboost',
    'svm',
    'knn',
    'naive_bayes',
    'neural_network',
    'kmeans',
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3 sm:gap-4 animate-fade-in">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-xl">
          <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Model Training</h2>
          <p className="text-sm sm:text-base text-slate-600">Configure and train ML models</p>
        </div>
      </div>

      <div className="section-card animate-slide-up">
        <div className="space-y-6 sm:space-y-8">
          <div>
            <label className="block text-base sm:text-lg font-bold text-slate-800 mb-4">
              Select Model Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {allModels.map(type => {
                const modelDesc = getModelDescription(type);
                return (
                  <button
                    key={type}
                    onClick={() => setModelType(type)}
                    disabled={isTraining}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-300 group ${
                      modelType === type
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg scale-105'
                        : 'border-slate-200 hover:border-blue-400 hover:shadow-lg hover:scale-105 bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-800 text-sm sm:text-base mb-2">
                      {modelDesc.name}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 mb-2 line-clamp-2">
                      {modelDesc.description}
                    </div>
                    <div className={`text-xs font-semibold ${modelType === type ? 'text-blue-600' : 'text-cyan-600 group-hover:text-blue-600'}`}>
                      {modelDesc.bestFor}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {modelType !== 'kmeans' && (
            <div>
              <label className="block text-base sm:text-lg font-bold text-slate-800 mb-3">
                Target Column (What to predict)
              </label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="input-field"
                disabled={isTraining}
              >
                <option value="">Select target column</option>
                {numericColumns.map(col => (
                  <option key={col.name} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-base sm:text-lg font-bold text-slate-800 mb-3">
              Feature Columns (Predictors)
            </label>
            <div className="border-2 border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto bg-slate-50 scrollbar-hide">
              {numericColumns.filter(col => col.name !== targetColumn).map(col => (
                <div key={col.name} className="flex items-center gap-3 mb-3 last:mb-0">
                  <input
                    type="checkbox"
                    id={`feature-${col.name}`}
                    checked={featureColumns.includes(col.name)}
                    onChange={() => handleFeatureToggle(col.name)}
                    className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-4 focus:ring-blue-100 transition-all"
                    disabled={isTraining}
                  />
                  <label htmlFor={`feature-${col.name}`} className="text-sm sm:text-base text-slate-700 cursor-pointer flex-1">
                    {col.name}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-blue-600 font-semibold mt-3 bg-blue-50 px-3 py-2 rounded-lg inline-block">
              Selected {featureColumns.length} feature{featureColumns.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <label className="block text-base sm:text-lg font-bold text-slate-800 mb-3">
              Test Set Size: <span className="text-blue-600">{(testSize * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={testSize}
              onChange={(e) => setTestSize(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-cyan-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
              disabled={isTraining}
            />
            <div className="flex justify-between text-xs sm:text-sm text-slate-600 mt-3">
              <span className="font-semibold">Train: {((1 - testSize) * 100).toFixed(0)}%</span>
              <span className="font-semibold">Test: {(testSize * 100).toFixed(0)}%</span>
            </div>
          </div>

          {(validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
            <div className="space-y-3 animate-scale-in">
              {validation.errors.map((error, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-red-800 font-medium">{error}</p>
                </div>
              ))}
              {validation.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-amber-800 font-medium">{warning}</p>
                </div>
              ))}
              {validation.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl shadow-sm">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-blue-800 font-medium">{suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {isTraining && (
            <div className="space-y-3 animate-scale-in">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-slate-700 font-semibold">Training Progress</span>
                <span className="font-bold text-blue-600">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 transition-all duration-300 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleTrain}
              disabled={isTraining || !validation.isValid}
              className="button-primary flex items-center gap-2 text-base sm:text-lg"
            >
              {isTraining ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Training
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="section-card animate-scale-in">
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold gradient-text">Training Results</h3>
              <p className="text-sm sm:text-base text-slate-600">Model: <span className="font-semibold text-emerald-600">{result.modelType.replace('_', ' ')}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {Object.entries(result.metrics).map(([key, value]) => (
              <div key={key} className="stat-card bg-gradient-to-br from-blue-50 to-cyan-100">
                <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase mb-2">{key}</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{value.toFixed(4)}</p>
              </div>
            ))}
          </div>

          {result.featureImportance && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
              <h4 className="font-bold text-lg sm:text-xl text-slate-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                Feature Importance
              </h4>
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(result.featureImportance)
                  .sort(([, a], [, b]) => b - a)
                  .map(([feature, importance]) => {
                    const maxImportance = Math.max(...Object.values(result.featureImportance!));
                    const percentage = (importance / maxImportance) * 100;
                    return (
                      <div key={feature}>
                        <div className="flex justify-between text-sm sm:text-base mb-2">
                          <span className="font-semibold text-slate-800">{feature}</span>
                          <span className="font-bold text-amber-600">{importance.toFixed(3)}</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-3 shadow-inner overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full shadow-lg transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="mt-6 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 shadow-sm">
            <p className="text-sm sm:text-base text-emerald-800 font-semibold">
              Training completed in <span className="font-bold text-emerald-600">{result.trainTime}ms</span>
              {result.testAccuracy && (
                <> with <span className="font-bold text-emerald-600">{(result.testAccuracy * 100).toFixed(2)}%</span> test accuracy</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
