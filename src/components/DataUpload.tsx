import { Upload, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

interface DataUploadProps {
  onDataUploaded: (data: Record<string, any>[], fileName: string) => void;
}

export default function DataUpload({ onDataUploaded }: DataUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    try {
      const text = await file.text();
      const { parseCSV } = await import('../utils/dataAnalysis');
      const data = parseCSV(text);

      if (data.length === 0) {
        alert('No valid data found in file');
        return;
      }

      onDataUploaded(data, file.name);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-3 border-dashed rounded-3xl p-12 sm:p-16 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 scale-105 shadow-2xl'
            : 'border-slate-300 glass-effect hover:border-blue-400 hover:shadow-2xl'
        }`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-6">
          {isProcessing ? (
            <>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center animate-pulse-slow shadow-xl">
                <FileSpreadsheet className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 animate-pulse" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">Processing your data...</p>
              <p className="text-sm text-slate-500">Analyzing structure and content</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl sm:text-3xl font-bold gradient-text">
                  Upload your CSV file
                </p>
                <p className="text-base sm:text-lg text-slate-600">
                  Drag and drop or click to browse
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-full">
                <FileSpreadsheet className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">CSV files only</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 glass-effect rounded-2xl border border-blue-100 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-slate-800 mb-3">Sample Data Format:</p>
            <code className="text-xs sm:text-sm text-slate-700 block bg-white p-4 rounded-xl border border-slate-200 font-mono">
              Name, Age, Salary, Department<br />
              John Doe, 30, 50000, Engineering<br />
              Jane Smith, 25, 45000, Marketing
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
