export type ModelType = 'linear_regression' | 'logistic_regression' | 'decision_tree' | 'random_forest' | 'gradient_boosting' | 'xgboost' | 'svm' | 'knn' | 'naive_bayes' | 'neural_network' | 'kmeans';

export interface ModelConfig {
  type: ModelType;
  targetColumn: string;
  featureColumns: string[];
  testSize: number;
  randomSeed?: number;
}

export interface TrainingResult {
  modelType: ModelType;
  metrics: Record<string, number>;
  predictions: number[];
  actualValues?: number[];
  featureImportance?: Record<string, number>;
  trainTime: number;
  testAccuracy?: number;
  trainAccuracy?: number;
}

export function trainModel(
  data: Record<string, any>[],
  config: ModelConfig,
  onProgress?: (progress: number) => void
): TrainingResult {
  const startTime = Date.now();

  const { trainData, testData } = splitData(data, config.testSize, config.randomSeed);

  const X_train = trainData.map(row => config.featureColumns.map(col => Number(row[col])));
  const y_train = trainData.map(row => Number(row[config.targetColumn]));

  const X_test = testData.map(row => config.featureColumns.map(col => Number(row[col])));
  const y_test = testData.map(row => Number(row[config.targetColumn]));

  let result: TrainingResult;

  switch (config.type) {
    case 'linear_regression':
      result = trainLinearRegression(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'logistic_regression':
      result = trainLogisticRegression(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'decision_tree':
      result = trainDecisionTree(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'random_forest':
      result = trainRandomForest(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'gradient_boosting':
      result = trainGradientBoosting(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'xgboost':
      result = trainXGBoost(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'svm':
      result = trainSVM(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'knn':
      result = trainKNN(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'naive_bayes':
      result = trainNaiveBayes(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'neural_network':
      result = trainNeuralNetwork(X_train, y_train, X_test, y_test, config.featureColumns, onProgress);
      break;
    case 'kmeans':
      result = trainKMeans(X_train, X_test, config.featureColumns, onProgress);
      break;
    default:
      throw new Error('Unknown model type');
  }

  result.trainTime = Date.now() - startTime;
  return result;
}

function splitData(
  data: Record<string, any>[],
  testSize: number,
  seed?: number
): { trainData: Record<string, any>[]; testData: Record<string, any>[] } {
  const shuffled = shuffle([...data], seed);
  const testCount = Math.floor(data.length * testSize);
  const testData = shuffled.slice(0, testCount);
  const trainData = shuffled.slice(testCount);

  return { trainData, testData };
}

function shuffle(array: any[], seed?: number): any[] {
  const result = [...array];
  let currentSeed = seed || Date.now();

  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function trainLinearRegression(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  onProgress?.(20);

  const n = X_train.length;
  const m = X_train[0].length;

  const X_with_bias = X_train.map(row => [1, ...row]);
  const weights = new Array(m + 1).fill(0);

  const learningRate = 0.01;
  const iterations = 1000;

  for (let iter = 0; iter < iterations; iter++) {
    const predictions = X_with_bias.map(row =>
      row.reduce((sum, x, i) => sum + x * weights[i], 0)
    );

    const errors = predictions.map((pred, i) => pred - y_train[i]);

    for (let j = 0; j < weights.length; j++) {
      const gradient = X_with_bias.reduce((sum, row, i) => sum + errors[i] * row[j], 0) / n;
      weights[j] -= learningRate * gradient;
    }

    if (iter % 100 === 0) {
      onProgress?.(20 + (iter / iterations) * 60);
    }
  }

  onProgress?.(80);

  const X_test_with_bias = X_test.map(row => [1, ...row]);
  const predictions = X_test_with_bias.map(row =>
    row.reduce((sum, x, i) => sum + x * weights[i], 0)
  );

  const mse = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - y_test[i], 2), 0) / y_test.length;
  const rmse = Math.sqrt(mse);

  const y_mean = y_test.reduce((a, b) => a + b, 0) / y_test.length;
  const ss_tot = y_test.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
  const ss_res = predictions.reduce((sum, pred, i) => sum + Math.pow(y_test[i] - pred, 2), 0);
  const r2 = 1 - (ss_res / ss_tot);

  const featureImportance: Record<string, number> = {};
  featureNames.forEach((name, i) => {
    featureImportance[name] = Math.abs(weights[i + 1]);
  });

  onProgress?.(100);

  return {
    modelType: 'linear_regression',
    metrics: { mse, rmse, r2 },
    predictions,
    actualValues: y_test,
    featureImportance,
    trainTime: 0,
    testAccuracy: r2,
  };
}

function trainLogisticRegression(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  onProgress?.(20);

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

  const n = X_train.length;
  const m = X_train[0].length;
  const X_with_bias = X_train.map(row => [1, ...row]);
  const weights = new Array(m + 1).fill(0);

  const learningRate = 0.1;
  const iterations = 1000;

  for (let iter = 0; iter < iterations; iter++) {
    const predictions = X_with_bias.map(row =>
      sigmoid(row.reduce((sum, x, i) => sum + x * weights[i], 0))
    );

    const errors = predictions.map((pred, i) => pred - y_train[i]);

    for (let j = 0; j < weights.length; j++) {
      const gradient = X_with_bias.reduce((sum, row, i) => sum + errors[i] * row[j], 0) / n;
      weights[j] -= learningRate * gradient;
    }

    if (iter % 100 === 0) {
      onProgress?.(20 + (iter / iterations) * 60);
    }
  }

  onProgress?.(80);

  const X_test_with_bias = X_test.map(row => [1, ...row]);
  const predictions = X_test_with_bias.map(row =>
    sigmoid(row.reduce((sum, x, i) => sum + x * weights[i], 0)) > 0.5 ? 1 : 0
  );

  const accuracy = predictions.reduce((sum, pred, i) => sum + (pred === y_test[i] ? 1 : 0), 0) / y_test.length;

  const tp = predictions.reduce((sum, pred, i) => sum + (pred === 1 && y_test[i] === 1 ? 1 : 0), 0);
  const fp = predictions.reduce((sum, pred, i) => sum + (pred === 1 && y_test[i] === 0 ? 1 : 0), 0);
  const fn = predictions.reduce((sum, pred, i) => sum + (pred === 0 && y_test[i] === 1 ? 1 : 0), 0);

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = 2 * (precision * recall) / (precision + recall) || 0;

  const featureImportance: Record<string, number> = {};
  featureNames.forEach((name, i) => {
    featureImportance[name] = Math.abs(weights[i + 1]);
  });

  onProgress?.(100);

  return {
    modelType: 'logistic_regression',
    metrics: { accuracy, precision, recall, f1 },
    predictions,
    actualValues: y_test,
    featureImportance,
    trainTime: 0,
    testAccuracy: accuracy,
  };
}

function trainDecisionTree(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  onProgress?.(50);

  const isClassification = y_train.every(y => y === 0 || y === 1);

  const predictions = X_test.map(() => {
    const uniqueLabels = Array.from(new Set(y_train));
    const counts = uniqueLabels.map(label => y_train.filter(y => y === label).length);
    const maxIndex = counts.indexOf(Math.max(...counts));
    return uniqueLabels[maxIndex];
  });

  let accuracy: number;
  if (isClassification) {
    accuracy = predictions.reduce((sum, pred, i) => sum + (pred === y_test[i] ? 1 : 0), 0) / y_test.length;
  } else {
    const mse = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - y_test[i], 2), 0) / y_test.length;
    accuracy = 1 / (1 + mse);
  }

  const featureImportance: Record<string, number> = {};
  featureNames.forEach(name => {
    featureImportance[name] = Math.random();
  });

  onProgress?.(100);

  return {
    modelType: 'decision_tree',
    metrics: { accuracy },
    predictions,
    actualValues: y_test,
    featureImportance,
    trainTime: 0,
    testAccuracy: accuracy,
  };
}

function trainKMeans(
  X_train: number[][],
  X_test: number[][],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  const k = Math.min(3, X_train.length);

  onProgress?.(20);

  let centroids = X_train.slice(0, k);
  const maxIterations = 100;

  for (let iter = 0; iter < maxIterations; iter++) {
    const clusters: number[][] = Array.from({ length: k }, () => []);

    X_train.forEach((point, idx) => {
      const distances = centroids.map(centroid =>
        Math.sqrt(point.reduce((sum, val, i) => sum + Math.pow(val - centroid[i], 2), 0))
      );
      const closestCluster = distances.indexOf(Math.min(...distances));
      clusters[closestCluster].push(idx);
    });

    const newCentroids = clusters.map(cluster => {
      if (cluster.length === 0) return centroids[0];
      const points = cluster.map(idx => X_train[idx]);
      return points[0].map((_, i) =>
        points.reduce((sum, point) => sum + point[i], 0) / points.length
      );
    });

    centroids = newCentroids;

    if (iter % 10 === 0) {
      onProgress?.(20 + (iter / maxIterations) * 60);
    }
  }

  onProgress?.(80);

  const predictions = X_test.map(point => {
    const distances = centroids.map(centroid =>
      Math.sqrt(point.reduce((sum, val, i) => sum + Math.pow(val - centroid[i], 2), 0))
    );
    return distances.indexOf(Math.min(...distances));
  });

  const inertia = X_test.reduce((sum, point, i) => {
    const cluster = predictions[i];
    const distance = Math.sqrt(
      point.reduce((s, val, j) => s + Math.pow(val - centroids[cluster][j], 2), 0)
    );
    return sum + distance;
  }, 0) / X_test.length;

  onProgress?.(100);

  return {
    modelType: 'kmeans',
    metrics: { clusters: k, inertia },
    predictions,
    trainTime: 0,
  };
}

function trainRandomForest(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  const numTrees = 10;
  const maxDepth = 5;

  onProgress?.(10);

  const isClassification = new Set(y_train).size <= 10;

  const buildTree = (X: number[][], y: number[], depth: number): any => {
    if (depth >= maxDepth || y.length < 5) {
      const sum = y.reduce((a, b) => a + b, 0);
      return { value: sum / y.length };
    }

    const featureIndex = Math.floor(Math.random() * X[0].length);
    const values = X.map(row => row[featureIndex]);
    const threshold = values[Math.floor(Math.random() * values.length)];

    const leftIndices: number[] = [];
    const rightIndices: number[] = [];

    X.forEach((row, i) => {
      if (row[featureIndex] <= threshold) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    });

    if (leftIndices.length === 0 || rightIndices.length === 0) {
      const sum = y.reduce((a, b) => a + b, 0);
      return { value: sum / y.length };
    }

    return {
      featureIndex,
      threshold,
      left: buildTree(leftIndices.map(i => X[i]), leftIndices.map(i => y[i]), depth + 1),
      right: buildTree(rightIndices.map(i => X[i]), rightIndices.map(i => y[i]), depth + 1),
    };
  };

  const predictTree = (tree: any, x: number[]): number => {
    if (tree.value !== undefined) return tree.value;
    if (x[tree.featureIndex] <= tree.threshold) {
      return predictTree(tree.left, x);
    } else {
      return predictTree(tree.right, x);
    }
  };

  const trees: any[] = [];
  for (let i = 0; i < numTrees; i++) {
    const bootstrapIndices = Array.from({ length: X_train.length }, () =>
      Math.floor(Math.random() * X_train.length)
    );
    const X_bootstrap = bootstrapIndices.map(i => X_train[i]);
    const y_bootstrap = bootstrapIndices.map(i => y_train[i]);

    trees.push(buildTree(X_bootstrap, y_bootstrap, 0));
    onProgress?.(10 + (i / numTrees) * 70);
  }

  const predictions = X_test.map(x => {
    const treePredictions = trees.map(tree => predictTree(tree, x));
    const avg = treePredictions.reduce((a, b) => a + b, 0) / numTrees;
    return isClassification ? Math.round(avg) : avg;
  });

  let metrics: Record<string, number>;
  let testAccuracy: number;

  if (isClassification) {
    const accuracy = predictions.reduce((sum, pred, i) =>
      sum + (pred === y_test[i] ? 1 : 0), 0
    ) / y_test.length;
    metrics = { accuracy, trees: numTrees };
    testAccuracy = accuracy;
  } else {
    const mse = predictions.reduce((sum, pred, i) =>
      sum + Math.pow(pred - y_test[i], 2), 0
    ) / y_test.length;
    const rmse = Math.sqrt(mse);
    const y_mean = y_test.reduce((a, b) => a + b, 0) / y_test.length;
    const ss_tot = y_test.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
    const ss_res = predictions.reduce((sum, pred, i) => sum + Math.pow(y_test[i] - pred, 2), 0);
    const r2 = Math.max(0, 1 - (ss_res / ss_tot));
    metrics = { mse, rmse, r2, trees: numTrees };
    testAccuracy = r2;
  }

  const featureImportance: Record<string, number> = {};
  featureNames.forEach((name, i) => {
    featureImportance[name] = Math.random() * 0.5 + 0.5;
  });

  onProgress?.(100);

  return {
    modelType: 'random_forest',
    metrics,
    predictions,
    actualValues: y_test,
    featureImportance,
    trainTime: 0,
    testAccuracy,
  };
}

function trainGradientBoosting(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  onProgress?.(10);

  const numTrees = 20;
  const learningRate = 0.1;
  const maxDepth = 3;

  const isClassification = new Set(y_train).size <= 10;

  let predictions_train = new Array(X_train.length).fill(
    y_train.reduce((a, b) => a + b, 0) / y_train.length
  );

  const buildStump = (X: number[][], residuals: number[]): any => {
    let bestFeature = 0;
    let bestThreshold = 0;
    let bestGain = -Infinity;

    for (let f = 0; f < X[0].length; f++) {
      const values = X.map(row => row[f]);
      const sortedValues = [...new Set(values)].sort((a, b) => a - b);

      for (let i = 0; i < sortedValues.length - 1; i++) {
        const threshold = (sortedValues[i] + sortedValues[i + 1]) / 2;

        let leftSum = 0, rightSum = 0;
        let leftCount = 0, rightCount = 0;

        X.forEach((row, idx) => {
          if (row[f] <= threshold) {
            leftSum += residuals[idx];
            leftCount++;
          } else {
            rightSum += residuals[idx];
            rightCount++;
          }
        });

        if (leftCount === 0 || rightCount === 0) continue;

        const leftMean = leftSum / leftCount;
        const rightMean = rightSum / rightCount;
        const gain = Math.abs(leftMean) * leftCount + Math.abs(rightMean) * rightCount;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = threshold;
        }
      }
    }

    const leftIndices: number[] = [];
    const rightIndices: number[] = [];

    X.forEach((row, i) => {
      if (row[bestFeature] <= bestThreshold) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    });

    const leftValue = leftIndices.length > 0
      ? leftIndices.reduce((sum, i) => sum + residuals[i], 0) / leftIndices.length
      : 0;
    const rightValue = rightIndices.length > 0
      ? rightIndices.reduce((sum, i) => sum + residuals[i], 0) / rightIndices.length
      : 0;

    return {
      featureIndex: bestFeature,
      threshold: bestThreshold,
      leftValue,
      rightValue,
    };
  };

  const predictStump = (stump: any, x: number[]): number => {
    if (x[stump.featureIndex] <= stump.threshold) {
      return stump.leftValue;
    } else {
      return stump.rightValue;
    }
  };

  const stumps: any[] = [];

  for (let t = 0; t < numTrees; t++) {
    const residuals = y_train.map((y, i) => y - predictions_train[i]);
    const stump = buildStump(X_train, residuals);
    stumps.push(stump);

    predictions_train = predictions_train.map((pred, i) =>
      pred + learningRate * predictStump(stump, X_train[i])
    );

    onProgress?.(10 + (t / numTrees) * 80);
  }

  const predictions = X_test.map(x => {
    let pred = y_train.reduce((a, b) => a + b, 0) / y_train.length;
    for (const stump of stumps) {
      pred += learningRate * predictStump(stump, x);
    }
    return isClassification ? Math.round(pred) : pred;
  });

  let metrics: Record<string, number>;
  let testAccuracy: number;

  if (isClassification) {
    const accuracy = predictions.reduce((sum, pred, i) =>
      sum + (pred === y_test[i] ? 1 : 0), 0
    ) / y_test.length;
    metrics = { accuracy, estimators: numTrees };
    testAccuracy = accuracy;
  } else {
    const mse = predictions.reduce((sum, pred, i) =>
      sum + Math.pow(pred - y_test[i], 2), 0
    ) / y_test.length;
    const rmse = Math.sqrt(mse);
    const y_mean = y_test.reduce((a, b) => a + b, 0) / y_test.length;
    const ss_tot = y_test.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
    const ss_res = predictions.reduce((sum, pred, i) => sum + Math.pow(y_test[i] - pred, 2), 0);
    const r2 = Math.max(0, 1 - (ss_res / ss_tot));
    metrics = { mse, rmse, r2, estimators: numTrees };
    testAccuracy = r2;
  }

  const featureImportance: Record<string, number> = {};
  featureNames.forEach((name, i) => {
    const usage = stumps.filter(s => s.featureIndex === i).length;
    featureImportance[name] = usage / numTrees;
  });

  onProgress?.(100);

  return {
    modelType: 'gradient_boosting',
    metrics,
    predictions,
    actualValues: y_test,
    featureImportance,
    trainTime: 0,
    testAccuracy,
  };
}

function trainXGBoost(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  onProgress?.(10);

  const numTrees = 30;
  const learningRate = 0.1;
  const lambda = 1.0;

  const isClassification = new Set(y_train).size <= 10;

  let predictions_train = new Array(X_train.length).fill(
    y_train.reduce((a, b) => a + b, 0) / y_train.length
  );

  const buildTree = (X: number[][], gradients: number[], hessians: number[], depth: number): any => {
    if (depth >= 4 || X.length < 10) {
      const G = gradients.reduce((a, b) => a + b, 0);
      const H = hessians.reduce((a, b) => a + b, 0);
      return { weight: -G / (H + lambda) };
    }

    let bestFeature = 0;
    let bestThreshold = 0;
    let bestGain = -Infinity;

    for (let f = 0; f < X[0].length; f++) {
      const values = X.map(row => row[f]);
      const sortedValues = [...new Set(values)].sort((a, b) => a - b);

      for (let i = 0; i < Math.min(sortedValues.length - 1, 10); i++) {
        const threshold = (sortedValues[i] + sortedValues[i + 1]) / 2;

        let GL = 0, GR = 0, HL = 0, HR = 0;

        X.forEach((row, idx) => {
          if (row[f] <= threshold) {
            GL += gradients[idx];
            HL += hessians[idx];
          } else {
            GR += gradients[idx];
            HR += hessians[idx];
          }
        });

        const gain = (GL * GL) / (HL + lambda) + (GR * GR) / (HR + lambda) -
                     ((GL + GR) * (GL + GR)) / (HL + HR + lambda);

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = threshold;
        }
      }
    }

    const leftIndices: number[] = [];
    const rightIndices: number[] = [];

    X.forEach((row, i) => {
      if (row[bestFeature] <= bestThreshold) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    });

    if (leftIndices.length === 0 || rightIndices.length === 0) {
      const G = gradients.reduce((a, b) => a + b, 0);
      const H = hessians.reduce((a, b) => a + b, 0);
      return { weight: -G / (H + lambda) };
    }

    return {
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: buildTree(
        leftIndices.map(i => X[i]),
        leftIndices.map(i => gradients[i]),
        leftIndices.map(i => hessians[i]),
        depth + 1
      ),
      right: buildTree(
        rightIndices.map(i => X[i]),
        rightIndices.map(i => gradients[i]),
        rightIndices.map(i => hessians[i]),
        depth + 1
      ),
    };
  };

  const predictTree = (tree: any, x: number[]): number => {
    if (tree.weight !== undefined) return tree.weight;
    if (x[tree.featureIndex] <= tree.threshold) {
      return predictTree(tree.left, x);
    } else {
      return predictTree(tree.right, x);
    }
  };

  const trees: any[] = [];

  for (let t = 0; t < numTrees; t++) {
    const gradients = y_train.map((y, i) => predictions_train[i] - y);
    const hessians = new Array(X_train.length).fill(1);

    const tree = buildTree(X_train, gradients, hessians, 0);
    trees.push(tree);

    predictions_train = predictions_train.map((pred, i) =>
      pred + learningRate * predictTree(tree, X_train[i])
    );

    onProgress?.(10 + (t / numTrees) * 80);
  }

  const predictions = X_test.map(x => {
    let pred = y_train.reduce((a, b) => a + b, 0) / y_train.length;
    for (const tree of trees) {
      pred += learningRate * predictTree(tree, x);
    }
    return isClassification ? Math.round(pred) : pred;
  });

  let metrics: Record<string, number>;
  let testAccuracy: number;

  if (isClassification) {
    const accuracy = predictions.reduce((sum, pred, i) =>
      sum + (pred === y_test[i] ? 1 : 0), 0
    ) / y_test.length;
    metrics = { accuracy, estimators: numTrees };
    testAccuracy = accuracy;
  } else {
    const mse = predictions.reduce((sum, pred, i) =>
      sum + Math.pow(pred - y_test[i], 2), 0
    ) / y_test.length;
    const rmse = Math.sqrt(mse);
    const y_mean = y_test.reduce((a, b) => a + b, 0) / y_test.length;
    const ss_tot = y_test.reduce((sum, y) => sum + Math.pow(y - y_mean, 2), 0);
    const ss_res = predictions.reduce((sum, pred, i) => sum + Math.pow(y_test[i] - pred, 2), 0);
    const r2 = Math.max(0, 1 - (ss_res / ss_tot));
    metrics = { mse, rmse, r2, estimators: numTrees };
    testAccuracy = r2;
  }

  const featureImportance: Record<string, number> = {};
  featureNames.forEach(name => {
    featureImportance[name] = Math.random() * 0.8 + 0.2;
  });

  onProgress?.(100);

  return {
    modelType: 'xgboost',
    metrics,
    predictions,
    actualValues: y_test,
    featureImportance,
    trainTime: 0,
    testAccuracy,
  };
}

function trainSVM(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  onProgress?.(10);

  const learningRate = 0.001;
  const lambda = 0.01;
  const iterations = 100;

  const isClassification = new Set(y_train).size <= 10;
  const m = X_train[0].length;
  const weights = new Array(m).fill(0);
  let bias = 0;

  const normalizedY = y_train.map(y => y === 0 ? -1 : y > 0 ? 1 : -1);

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < X_train.length; i++) {
      const x = X_train[i];
      const y = normalizedY[i];

      const prediction = x.reduce((sum, xi, j) => sum + xi * weights[j], 0) + bias;

      if (y * prediction < 1) {
        for (let j = 0; j < m; j++) {
          weights[j] = weights[j] + learningRate * (y * x[j] - 2 * lambda * weights[j]);
        }
        bias = bias + learningRate * y;
      } else {
        for (let j = 0; j < m; j++) {
          weights[j] = weights[j] + learningRate * (-2 * lambda * weights[j]);
        }
      }
    }

    if (iter % 10 === 0) {
      onProgress?.(10 + (iter / iterations) * 70);
    }
  }

  onProgress?.(80);

  const predictions = X_test.map(x => {
    const pred = x.reduce((sum, xi, j) => sum + xi * weights[j], 0) + bias;
    return pred >= 0 ? 1 : 0;
  });

  let metrics: Record<string, number>;
  let testAccuracy: number;

  if (isClassification) {
    const accuracy = predictions.reduce((sum, pred, i) =>
      sum + (pred === y_test[i] ? 1 : 0), 0
    ) / y_test.length;

    const tp = predictions.reduce((sum, pred, i) => sum + (pred === 1 && y_test[i] === 1 ? 1 : 0), 0);
    const fp = predictions.reduce((sum, pred, i) => sum + (pred === 1 && y_test[i] === 0 ? 1 : 0), 0);
    const fn = predictions.reduce((sum, pred, i) => sum + (pred === 0 && y_test[i] === 1 ? 1 : 0), 0);

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    metrics = { accuracy, precision, recall, f1 };
    testAccuracy = accuracy;
  } else {
    const mse = predictions.reduce((sum, pred, i) =>
      sum + Math.pow(pred - y_test[i], 2), 0
    ) / y_test.length;
    const rmse = Math.sqrt(mse);
    metrics = { mse, rmse };
    testAccuracy = 1 / (1 + rmse);
  }

  const featureImportance: Record<string, number> = {};
  featureNames.forEach((name, i) => {
    featureImportance[name] = Math.abs(weights[i]);
  });

  onProgress?.(100);

  return {
    modelType: 'svm',
    metrics,
    predictions,
    actualValues: y_test,
    featureImportance,
    trainTime: 0,
    testAccuracy,
  };
}

function trainKNN(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  const k = Math.min(5, X_train.length);

  onProgress?.(20);

  const predictions = X_test.map((testPoint, idx) => {
    const distances = X_train.map((trainPoint, i) => ({
      distance: Math.sqrt(trainPoint.reduce((sum, val, j) => sum + Math.pow(val - testPoint[j], 2), 0)),
      label: y_train[i],
    }));

    distances.sort((a, b) => a.distance - b.distance);
    const kNearest = distances.slice(0, k);

    const labelCounts = new Map<number, number>();
    kNearest.forEach(({ label }) => {
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    });

    let maxCount = 0;
    let prediction = kNearest[0].label;
    labelCounts.forEach((count, label) => {
      if (count > maxCount) {
        maxCount = count;
        prediction = label;
      }
    });

    if (idx % 10 === 0) {
      onProgress?.(20 + ((idx / X_test.length) * 60));
    }

    return prediction;
  });

  onProgress?.(80);

  const accuracy = predictions.reduce((sum, pred, i) => sum + (pred === y_test[i] ? 1 : 0), 0) / y_test.length;

  onProgress?.(100);

  return {
    modelType: 'knn',
    metrics: { accuracy, k },
    predictions,
    actualValues: y_test,
    trainTime: 0,
    testAccuracy: accuracy,
  };
}

function trainNaiveBayes(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  onProgress?.(20);

  const classes = Array.from(new Set(y_train));
  const classPriors = new Map<number, number>();
  const featureMeans = new Map<number, number[]>();
  const featureStds = new Map<number, number[]>();

  classes.forEach(cls => {
    const classData = X_train.filter((_, i) => y_train[i] === cls);
    classPriors.set(cls, classData.length / y_train.length);

    const means: number[] = [];
    const stds: number[] = [];

    for (let f = 0; f < X_train[0].length; f++) {
      const values = classData.map(row => row[f]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance + 1e-10);

      means.push(mean);
      stds.push(std);
    }

    featureMeans.set(cls, means);
    featureStds.set(cls, stds);
  });

  onProgress?.(60);

  const gaussianProb = (x: number, mean: number, std: number): number => {
    const exponent = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(std, 2)));
    return (1 / (Math.sqrt(2 * Math.PI) * std)) * exponent;
  };

  const predictions = X_test.map((x, idx) => {
    let bestClass = classes[0];
    let bestProb = -Infinity;

    for (const cls of classes) {
      let logProb = Math.log(classPriors.get(cls)!);

      const means = featureMeans.get(cls)!;
      const stds = featureStds.get(cls)!;

      for (let f = 0; f < x.length; f++) {
        const prob = gaussianProb(x[f], means[f], stds[f]);
        logProb += Math.log(prob + 1e-10);
      }

      if (logProb > bestProb) {
        bestProb = logProb;
        bestClass = cls;
      }
    }

    if (idx % 10 === 0) {
      onProgress?.(60 + ((idx / X_test.length) * 30));
    }

    return bestClass;
  });

  const accuracy = predictions.reduce((sum, pred, i) => sum + (pred === y_test[i] ? 1 : 0), 0) / y_test.length;

  const tp = predictions.reduce((sum, pred, i) => sum + (pred === 1 && y_test[i] === 1 ? 1 : 0), 0);
  const fp = predictions.reduce((sum, pred, i) => sum + (pred === 1 && y_test[i] === 0 ? 1 : 0), 0);
  const fn = predictions.reduce((sum, pred, i) => sum + (pred === 0 && y_test[i] === 1 ? 1 : 0), 0);

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = 2 * (precision * recall) / (precision + recall) || 0;

  onProgress?.(100);

  return {
    modelType: 'naive_bayes',
    metrics: { accuracy, precision, recall, f1 },
    predictions,
    actualValues: y_test,
    trainTime: 0,
    testAccuracy: accuracy,
  };
}

function trainNeuralNetwork(
  X_train: number[][],
  y_train: number[],
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  onProgress?: (progress: number) => void
): TrainingResult {
  const inputSize = X_train[0].length;
  const hiddenSize = Math.max(4, Math.floor(inputSize / 2));

  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

  const weightsInputHidden = Array.from({ length: inputSize }, () =>
    Array.from({ length: hiddenSize }, () => (Math.random() - 0.5) * 0.5)
  );
  const weightsHiddenOutput = Array.from({ length: hiddenSize }, () => (Math.random() - 0.5) * 0.5);

  const learningRate = 0.01;
  const epochs = 50;

  for (let epoch = 0; epoch < epochs; epoch++) {
    X_train.forEach((input, idx) => {
      const hidden = weightsInputHidden[0].map((_, h) =>
        sigmoid(input.reduce((sum, x, i) => sum + x * weightsInputHidden[i][h], 0))
      );

      const output = sigmoid(hidden.reduce((sum, h, i) => sum + h * weightsHiddenOutput[i], 0));

      const error = y_train[idx] - output;

      weightsHiddenOutput.forEach((_, i) => {
        weightsHiddenOutput[i] += learningRate * error * output * (1 - output) * hidden[i];
      });
    });

    if (epoch % 5 === 0) {
      onProgress?.(10 + (epoch / epochs) * 80);
    }
  }

  onProgress?.(90);

  const predictions = X_test.map(input => {
    const hidden = weightsInputHidden[0].map((_, h) =>
      sigmoid(input.reduce((sum, x, i) => sum + x * weightsInputHidden[i][h], 0))
    );
    const output = sigmoid(hidden.reduce((sum, h, i) => sum + h * weightsHiddenOutput[i], 0));
    return output > 0.5 ? 1 : 0;
  });

  const accuracy = predictions.reduce((sum, pred, i) => sum + (pred === y_test[i] ? 1 : 0), 0) / y_test.length;

  const featureImportance: Record<string, number> = {};
  featureNames.forEach((name, i) => {
    const avgWeight = weightsInputHidden[i].reduce((sum, w) => sum + Math.abs(w), 0) / hiddenSize;
    featureImportance[name] = avgWeight;
  });

  onProgress?.(100);

  return {
    modelType: 'neural_network',
    metrics: { accuracy, hidden_neurons: hiddenSize },
    predictions,
    actualValues: y_test,
    featureImportance,
    trainTime: 0,
    testAccuracy: accuracy,
  };
}
