import { useState } from 'react';
import { Sparkles, Download, Trash2, ChevronRight } from 'lucide-react';
import DataUpload from './components/DataUpload';
import CompactAnalysis from './components/CompactAnalysis';
import PreprocessingPanel from './components/PreprocessingPanel';
import ModelTraining from './components/ModelTraining';
import { supabase, ColumnInfo, ColumnStats, Insight } from './lib/supabase';
import { detectColumnType, analyzeColumn, generateInsights } from './utils/dataAnalysis';
import { preprocessData, PreprocessingConfig, PreprocessedData } from './utils/preprocessing';
import { trainModel, ModelConfig, TrainingResult } from './utils/modeling';

type AppStep = 'upload' | 'analyze' | 'preprocess' | 'model';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [originalData, setOriginalData] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [columnInfo, setColumnInfo] = useState<ColumnInfo[]>([]);
  const [statistics, setStatistics] = useState<Record<string, ColumnStats>>({});
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preprocessedData, setPreprocessedData] = useState<PreprocessedData | null>(null);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [datasetId, setDatasetId] = useState<string | null>(null);

  const handleDataUploaded = async (uploadedData: Record<string, any>[], name: string) => {
    setIsAnalyzing(true);
    setData(uploadedData);
    setOriginalData(uploadedData);
    setFileName(name);

    const columns = Object.keys(uploadedData[0]);
    const colInfo: ColumnInfo[] = columns.map(colName => {
      const values = uploadedData.map(row => row[colName]);
      const type = detectColumnType(values);
      const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
      return {
        name: colName,
        type,
        nullable: nullCount > 0,
      };
    });

    const stats: Record<string, ColumnStats> = {};
    colInfo.forEach(col => {
      const values = uploadedData.map(row => row[col.name]);
      stats[col.name] = analyzeColumn(col.name, values, col.type);
    });

    const generatedInsights = generateInsights(uploadedData, colInfo, stats);

    setColumnInfo(colInfo);
    setStatistics(stats);
    setInsights(generatedInsights);

    try {
      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .insert({
          name: name.replace('.csv', ''),
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
          data: uploadedData,
          column_info: colInfo,
          row_count: uploadedData.length,
        })
        .select()
        .maybeSingle();

      if (dataset && !datasetError) {
        setDatasetId(dataset.id);
        await supabase.from('analysis_results').insert({
          dataset_id: dataset.id,
          statistics: stats,
          insights: generatedInsights,
        });
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }

    setIsAnalyzing(false);
    setCurrentStep('analyze');
  };

  const handlePreprocess = async (config: PreprocessingConfig) => {
    setIsPreprocessing(true);
    try {
      const result = preprocessData(originalData, config);
      setPreprocessedData(result);
      setData(result.data);

      if (datasetId) {
        await supabase.from('preprocessing_results').insert({
          dataset_id: datasetId,
          config,
          removed_rows: result.removedRows,
          encodings: result.encodings,
          scaling_params: result.scalingParams,
        });
      }

      setCurrentStep('model');
    } catch (error) {
      console.error('Preprocessing error:', error);
      alert('Preprocessing failed. Please check your configuration.');
    } finally {
      setIsPreprocessing(false);
    }
  };

  const handleTrain = async (config: ModelConfig, onProgress: (progress: number) => void): Promise<TrainingResult> => {
    const result = await new Promise<TrainingResult>((resolve) => {
      setTimeout(() => {
        const trainingResult = trainModel(data, config, onProgress);
        resolve(trainingResult);
      }, 100);
    });

    if (datasetId) {
      try {
        await supabase.from('ml_models').insert({
          dataset_id: datasetId,
          model_type: config.type,
          config,
          metrics: result.metrics,
          feature_importance: result.featureImportance,
          train_time: result.trainTime,
          test_accuracy: result.testAccuracy,
        });
      } catch (error) {
        console.error('Error saving model:', error);
      }
    }

    return result;
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setData([]);
    setOriginalData([]);
    setFileName('');
    setColumnInfo([]);
    setStatistics({});
    setInsights([]);
    setPreprocessedData(null);
    setDatasetId(null);
  };

  const handleExport = () => {
    const report = {
      fileName,
      uploadDate: new Date().toISOString(),
      summary: {
        rows: data.length,
        columns: columnInfo.length,
      },
      statistics,
      insights,
      preprocessing: preprocessedData,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${fileName.replace('.csv', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
        <header className="mb-8 sm:mb-12 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-1">
                  AI Data Analysis Studio
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  Intelligent analysis, preprocessing & ML modeling
                </p>
              </div>
            </div>

            {data.length > 0 && (
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg transition-all duration-300 flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-red-600 rounded-xl border-2 border-red-200 hover:border-red-500 hover:bg-red-50 hover:shadow-lg transition-all duration-300 flex-1 sm:flex-none"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">New Analysis</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {currentStep === 'upload' && (
          <div className="py-6 sm:py-12 animate-slide-up">
            <DataUpload onDataUploaded={handleDataUploaded} />
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center py-12 sm:py-20 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse-slow shadow-2xl">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Analyzing your data...</p>
              <p className="text-sm sm:text-base text-slate-500">This will just take a moment</p>
            </div>
          </div>
        )}

        {currentStep === 'analyze' && !isAnalyzing && (
          <div className="space-y-6 sm:space-y-8 animate-slide-up">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
              {(['analyze', 'preprocess', 'model'] as const).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 ${
                    currentStep === step
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    <span className="hidden sm:inline">{index + 1}. </span>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </div>
                  {index < 2 && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mx-1 sm:mx-2" />}
                </div>
              ))}
            </div>

            <CompactAnalysis
              data={data}
              columnInfo={columnInfo}
              statistics={statistics}
              insights={insights}
            />

            <div className="flex justify-center pt-4">
              <button
                onClick={() => setCurrentStep('preprocess')}
                className="button-primary flex items-center gap-2 text-base sm:text-lg"
              >
                Continue to Preprocessing
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'preprocess' && (
          <div className="space-y-6 sm:space-y-8 animate-slide-up">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
              {(['analyze', 'preprocess', 'model'] as const).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 ${
                    currentStep === step
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                      : step === 'analyze'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    <span className="hidden sm:inline">{index + 1}. </span>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </div>
                  {index < 2 && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mx-1 sm:mx-2" />}
                </div>
              ))}
            </div>

            <PreprocessingPanel data={originalData} columnInfo={columnInfo} onPreprocess={handlePreprocess} isProcessing={isPreprocessing} />

            {preprocessedData && (
              <div className="section-card animate-scale-in">
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-4 sm:mb-6">Preprocessing Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">Removed Rows</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-700">{preprocessedData.removedRows}</p>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">Final Rows</p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{preprocessedData.data.length}</p>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-amber-50 to-amber-100">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">Encoded Features</p>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-700">{Object.keys(preprocessedData.encodings).length}</p>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-rose-50 to-rose-100">
                    <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">Scaled Features</p>
                    <p className="text-2xl sm:text-3xl font-bold text-rose-700">{Object.keys(preprocessedData.scalingParams).length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'model' && (
          <div className="space-y-6 sm:space-y-8 animate-slide-up">
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
              {(['analyze', 'preprocess', 'model'] as const).map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 ${
                    currentStep === step
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg scale-105'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    <span className="hidden sm:inline">{index + 1}. </span>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </div>
                  {index < 2 && <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mx-1 sm:mx-2" />}
                </div>
              ))}
            </div>

            <ModelTraining data={data} columnInfo={columnInfo} onTrain={handleTrain} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
