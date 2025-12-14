/*
  # Create datasets table for data analysis

  1. New Tables
    - `datasets`
      - `id` (uuid, primary key) - Unique identifier for each dataset
      - `name` (text) - Name of the dataset
      - `description` (text) - Optional description
      - `data` (jsonb) - The actual dataset stored as JSON
      - `column_info` (jsonb) - Metadata about columns (types, names)
      - `row_count` (integer) - Number of rows in the dataset
      - `created_at` (timestamptz) - When the dataset was uploaded
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `analysis_results`
      - `id` (uuid, primary key) - Unique identifier
      - `dataset_id` (uuid, foreign key) - Reference to the dataset
      - `statistics` (jsonb) - Statistical analysis results
      - `insights` (jsonb) - Generated insights
      - `created_at` (timestamptz) - When analysis was performed
  
  2. Security
    - Enable RLS on both tables
    - Allow public read access for demo purposes
    - Allow public insert/update for demo purposes
*/

-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  data jsonb NOT NULL,
  column_info jsonb NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analysis results table
CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  statistics jsonb NOT NULL,
  insights jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo purposes)
CREATE POLICY "Allow public read access to datasets"
  ON datasets FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to datasets"
  ON datasets FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to datasets"
  ON datasets FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from datasets"
  ON datasets FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to analysis results"
  ON analysis_results FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to analysis results"
  ON analysis_results FOR INSERT
  TO public
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_dataset_id ON analysis_results(dataset_id);