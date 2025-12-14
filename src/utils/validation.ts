import { ColumnInfo } from '../lib/supabase';
import { PreprocessingConfig } from './preprocessing';
import { ModelType } from './modeling';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export function validatePreprocessing(
  data: Record<string, any>[],
  columnInfo: ColumnInfo[],
  config: PreprocessingConfig
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (data.length < 10) {
    warnings.push('Dataset sangat kecil (< 10 rows). Preprocessing mungkin tidak efektif.');
  }

  const numericColumns = columnInfo.filter(c => c.type === 'number');
  const stringColumns = columnInfo.filter(c => c.type === 'string');

  if (config.normalization !== 'none' && numericColumns.length === 0) {
    errors.push('Tidak ada kolom numerik untuk dinormalisasi. Pilih "None" untuk normalization.');
  }

  if (config.encodeCategories && stringColumns.length === 0) {
    warnings.push('Tidak ada kolom kategorikal untuk di-encode.');
    suggestions.push('Nonaktifkan "Encode Categories" jika tidak diperlukan.');
  }

  if (config.removeOutliers && numericColumns.length === 0) {
    errors.push('Tidak ada kolom numerik untuk mendeteksi outliers.');
  }

  if (config.handleMissing === 'remove') {
    const rowsWithMissing = data.filter(row =>
      columnInfo.some(col => row[col.name] === null || row[col.name] === undefined || row[col.name] === '')
    ).length;

    if (rowsWithMissing > data.length * 0.5) {
      warnings.push(`${rowsWithMissing} rows (${((rowsWithMissing / data.length) * 100).toFixed(1)}%) akan dihapus. Pertimbangkan imputation.`);
      suggestions.push('Gunakan mean/median/mode imputation untuk mempertahankan lebih banyak data.');
    }
  }

  if (config.removeOutliers) {
    suggestions.push('Outlier removal dapat menghilangkan data penting. Periksa hasilnya dengan hati-hati.');
  }

  const categoricalWithManyValues = stringColumns.filter(col => {
    const stats = data.map(row => row[col.name]);
    const uniqueCount = new Set(stats).size;
    return uniqueCount > 50;
  });

  if (config.encodeCategories && categoricalWithManyValues.length > 0) {
    warnings.push(`${categoricalWithManyValues.length} kolom kategorikal memiliki >50 unique values. Encoding akan membuat banyak features.`);
    suggestions.push('Pertimbangkan untuk menghapus kolom high-cardinality sebelum encoding.');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

export function validateModeling(
  data: Record<string, any>[],
  columnInfo: ColumnInfo[],
  modelType: ModelType,
  targetColumn: string,
  featureColumns: string[]
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (data.length < 20) {
    errors.push('Dataset terlalu kecil untuk training ML (minimum 20 rows diperlukan).');
    return { isValid: false, warnings, errors, suggestions };
  }

  if (data.length < 100) {
    warnings.push('Dataset kecil. Model mungkin kurang akurat. Ideal: >100 rows.');
  }

  const numericColumns = columnInfo.filter(c => c.type === 'number');

  if (modelType !== 'kmeans' && !targetColumn) {
    errors.push('Pilih target column yang ingin diprediksi.');
  }

  if (featureColumns.length === 0) {
    errors.push('Pilih minimal 1 feature column untuk training.');
  }

  if (featureColumns.length === 1) {
    warnings.push('Hanya 1 feature digunakan. Model mungkin kurang akurat.');
    suggestions.push('Tambahkan lebih banyak features untuk hasil lebih baik.');
  }

  if (modelType === 'logistic_regression' || modelType === 'decision_tree' || modelType === 'naive_bayes') {
    if (targetColumn) {
      const targetValues = data.map(row => row[targetColumn]);
      const uniqueValues = new Set(targetValues);

      if (uniqueValues.size > 10) {
        warnings.push(`Target column memiliki ${uniqueValues.size} unique values. Klasifikasi biasanya untuk <10 classes.`);
        suggestions.push('Pertimbangkan regression jika target adalah nilai kontinu.');
      }

      if (uniqueValues.size === 2) {
        suggestions.push('Data cocok untuk binary classification (2 classes).');
      }
    }
  }

  if (modelType === 'linear_regression') {
    if (targetColumn) {
      const targetValues = data.map(row => Number(row[targetColumn])).filter(v => !isNaN(v));
      const uniqueValues = new Set(targetValues);

      if (uniqueValues.size < 10) {
        warnings.push(`Target column hanya memiliki ${uniqueValues.size} unique values. Linear regression lebih cocok untuk nilai kontinu.`);
        suggestions.push('Pertimbangkan classification model jika target adalah kategori.');
      }
    }
  }

  if (modelType === 'random_forest' || modelType === 'gradient_boosting' || modelType === 'xgboost') {
    if (data.length < 100) {
      warnings.push('Tree-based models membutuhkan lebih banyak data (ideal: >500 rows).');
    }

    if (featureColumns.length < 3) {
      warnings.push('Random Forest/Gradient Boosting/XGBoost lebih efektif dengan banyak features (>3).');
    }

    if (modelType === 'xgboost') {
      suggestions.push('XGBoost menggunakan gradient boosting dengan regularization untuk mencegah overfitting.');
    }
  }

  if (modelType === 'svm') {
    if (data.length > 5000) {
      warnings.push('SVM lambat pada dataset besar (>5000 rows). Training mungkin memakan waktu lama.');
    }

    if (featureColumns.length > 50) {
      warnings.push('SVM dengan banyak features (>50) membutuhkan waktu training lama.');
    }
  }

  if (modelType === 'neural_network') {
    if (data.length < 500) {
      warnings.push('Neural network membutuhkan banyak data (ideal: >1000 rows) untuk training efektif.');
    }

    suggestions.push('Neural network mungkin overfit pada dataset kecil. Monitor training dan validation accuracy.');
  }

  if (modelType === 'knn') {
    if (data.length > 10000) {
      warnings.push('KNN lambat pada dataset besar. Pertimbangkan sampling atau model lain.');
    }

    const hasHighCardinalityFeatures = featureColumns.some(col => {
      const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
      const range = Math.max(...values) - Math.min(...values);
      return range > 1000;
    });

    if (hasHighCardinalityFeatures) {
      suggestions.push('Normalisasi sangat penting untuk KNN. Pastikan data sudah di-normalize.');
    }
  }

  if (modelType === 'kmeans') {
    if (numericColumns.length < 2) {
      errors.push('K-Means membutuhkan minimal 2 numeric features untuk clustering.');
    }

    if (data.length < 30) {
      warnings.push('Dataset terlalu kecil untuk clustering yang bermakna.');
    }

    suggestions.push('K-Means cocok untuk menemukan pola tersembunyi dalam data tanpa label.');
  }

  const testSize = 0.2;
  const testRows = Math.floor(data.length * testSize);
  if (testRows < 10) {
    warnings.push(`Test set hanya ${testRows} rows. Hasil evaluasi mungkin tidak reliable.`);
    suggestions.push('Gunakan lebih banyak data atau kurangi test size.');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

export function getModelDescription(modelType: ModelType): { name: string; description: string; bestFor: string } {
  const descriptions = {
    linear_regression: {
      name: 'Linear Regression',
      description: 'Model sederhana untuk prediksi nilai kontinu menggunakan hubungan linear',
      bestFor: 'Prediksi harga, sales, suhu, dll. Target: nilai kontinu',
    },
    logistic_regression: {
      name: 'Logistic Regression',
      description: 'Model klasifikasi binary menggunakan fungsi sigmoid',
      bestFor: 'Klasifikasi 2 kategori (yes/no, spam/ham). Target: 0 atau 1',
    },
    decision_tree: {
      name: 'Decision Tree',
      description: 'Model berbasis aturan yang mudah diinterpretasi',
      bestFor: 'Klasifikasi atau regression dengan data non-linear',
    },
    random_forest: {
      name: 'Random Forest',
      description: 'Ensemble dari banyak decision trees untuk akurasi tinggi',
      bestFor: 'Klasifikasi/regression kompleks, menangani overfitting dengan baik',
    },
    gradient_boosting: {
      name: 'Gradient Boosting',
      description: 'Ensemble method yang membangun trees secara sequential',
      bestFor: 'Kompetisi ML, akurasi maksimal, data terstruktur',
    },
    xgboost: {
      name: 'XGBoost',
      description: 'Extreme Gradient Boosting dengan regularization dan optimisasi tinggi',
      bestFor: 'Kompetisi Kaggle, performa terbaik, dataset structured',
    },
    svm: {
      name: 'Support Vector Machine',
      description: 'Mencari hyperplane optimal untuk memisahkan classes',
      bestFor: 'Klasifikasi dengan boundaries kompleks, dataset kecil-menengah',
    },
    knn: {
      name: 'K-Nearest Neighbors',
      description: 'Klasifikasi berdasarkan K tetangga terdekat',
      bestFor: 'Klasifikasi sederhana, data dengan clusters jelas',
    },
    naive_bayes: {
      name: 'Naive Bayes',
      description: 'Model probabilistik berbasis teorema Bayes',
      bestFor: 'Text classification, spam detection, dataset besar',
    },
    neural_network: {
      name: 'Neural Network',
      description: 'Multi-layer perceptron untuk pattern recognition kompleks',
      bestFor: 'Pattern kompleks, dataset besar, image/text processing',
    },
    kmeans: {
      name: 'K-Means Clustering',
      description: 'Mengelompokkan data berdasarkan similarity (unsupervised)',
      bestFor: 'Customer segmentation, pattern discovery tanpa label',
    },
  };

  return descriptions[modelType];
}
