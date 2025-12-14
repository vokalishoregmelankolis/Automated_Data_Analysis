/*
  # Add ML Models and Preprocessing Tables

  1. New Tables
    - `preprocessing_results`
      - `id` (uuid, primary key) - Unique identifier
      - `dataset_id` (uuid, foreign key) - Reference to the dataset
      - `config` (jsonb) - Preprocessing configuration used
      - `removed_rows` (integer) - Number of rows removed
      - `encodings` (jsonb) - Category encodings applied
      - `scaling_params` (jsonb) - Normalization parameters
      - `created_at` (timestamptz) - When preprocessing was done
    
    - `ml_models`
      - `id` (uuid, primary key) - Unique identifier
      - `dataset_id` (uuid, foreign key) - Reference to the dataset
      - `model_type` (text) - Type of ML model
      - `config` (jsonb) - Model configuration
      - `metrics` (jsonb) - Training metrics
      - `feature_importance` (jsonb) - Feature importance scores
      - `train_time` (integer) - Training time in milliseconds
      - `test_accuracy` (numeric) - Test set accuracy
      - `created_at` (timestamptz) - When model was trained
  
  2. Security
    - Enable RLS on both tables
    - Allow public access for demo purposes
*/

-- Create preprocessing results table
CREATE TABLE IF NOT EXISTS preprocessing_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  config jsonb NOT NULL,
  removed_rows integer DEFAULT 0,
  encodings jsonb,
  scaling_params jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ML models table
CREATE TABLE IF NOT EXISTS ml_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  model_type text NOT NULL,
  config jsonb NOT NULL,
  metrics jsonb NOT NULL,
  feature_importance jsonb,
  train_time integer NOT NULL,
  test_accuracy numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE preprocessing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to preprocessing results"
  ON preprocessing_results FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to preprocessing results"
  ON preprocessing_results FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to ml models"
  ON ml_models FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to ml models"
  ON ml_models FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_preprocessing_dataset_id ON preprocessing_results(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_dataset_id ON ml_models(dataset_id);