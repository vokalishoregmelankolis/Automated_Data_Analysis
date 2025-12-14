# AI Data Analysis Studio

A modern, intelligent data analysis platform that automates exploratory data analysis (EDA), data preprocessing, and machine learning model training. Built with React, TypeScript, and Supabase.

## Features

### Data Upload & Analysis
- **CSV File Support**: Drag-and-drop or click to upload CSV files
- **Automatic Data Type Detection**: Intelligently identifies numeric, categorical, and date columns
- **Instant Analysis**: Get comprehensive insights about your data in seconds
- **Data Validation**: Ensures data quality and format before processing

### Smart Analysis Dashboard
- **Overview**: Quick summary with key statistics and dataset information
- **Insights Panel**: AI-generated insights about patterns, anomalies, and data quality
- **Statistics**: Detailed statistical analysis including mean, median, mode, std dev, and quartiles
- **Visualizations**: Interactive charts and graphs for data exploration
- **Correlation Matrix**: Visual correlation heatmaps between numeric features
- **Data Table**: Paginated view of your raw data

### Data Preprocessing
- **Missing Value Handling**: Multiple strategies (remove, mean, median, mode, forward/backward fill)
- **Outlier Detection**: Automatic outlier identification and removal options
- **Categorical Encoding**: Label encoding and one-hot encoding for categorical variables
- **Feature Scaling**: Standardization and normalization options
- **Real-time Preview**: See the impact of preprocessing before applying

### Machine Learning Models
Support for 11 different ML algorithms:

**Regression Models:**
- Linear Regression
- Decision Tree Regressor
- Random Forest Regressor
- Gradient Boosting Regressor
- XGBoost Regressor
- Support Vector Regressor (SVR)
- K-Nearest Neighbors Regressor

**Classification Models:**
- Logistic Regression
- Naive Bayes
- Neural Network

**Clustering:**
- K-Means Clustering

### Model Training Features
- **Interactive Configuration**: Select target variable, features, and hyperparameters
- **Train-Test Split**: Customizable test size (10-40%)
- **Real-time Progress**: Live progress bar during training
- **Performance Metrics**: Comprehensive metrics (MSE, RMSE, MAE, R² for regression)
- **Feature Importance**: Visual representation of feature impact
- **Model Persistence**: All models and results saved to database

## Technology Stack

### Frontend
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Beautiful icon library

### Backend & Database
- **Supabase**: PostgreSQL database with real-time capabilities
- **Row Level Security**: Secure data access policies
- **Automatic Backups**: Data persistence and recovery

### Design System
- **Glass Morphism**: Modern frosted glass effects
- **Gradient Animations**: Smooth color transitions
- **Responsive Design**: Mobile-first approach (320px - 2560px+)
- **Smooth Animations**: Fade-in, slide-up, and scale effects
- **Accessible**: WCAG compliant with proper contrast ratios

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git
- Supabase account (optional, already configured)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd project
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
The `.env` file is already configured with Supabase credentials. No additional setup needed.

4. **Run the development server**
```bash
npm run dev
```

The app will open at `http://localhost:5173`

5. **Build for production**
```bash
npm run build
```

## How to Use

### Step 1: Upload Your Data

1. Navigate to the upload page (default landing page)
2. Drag and drop a CSV file or click to browse
3. Supported format:
   ```csv
   Name, Age, Salary, Department
   John Doe, 30, 50000, Engineering
   Jane Smith, 25, 45000, Marketing
   ```
4. Wait for automatic analysis (usually 1-2 seconds)

### Step 2: Review Analysis

After upload, you'll see 6 tabs:

**Overview Tab:**
- Dataset summary (rows, columns, size)
- Data quality indicators
- Recommended actions

**Insights Tab:**
- AI-generated findings
- Pattern detection
- Data quality issues
- Suggestions for improvement

**Statistics Tab:**
- Descriptive statistics for all columns
- Distribution information
- Unique value counts

**Charts Tab:**
- Histograms for numeric columns
- Bar charts for categorical data
- Distribution plots

**Correlations Tab:**
- Correlation matrix heatmap
- Relationship strength between variables
- Color-coded visualization

**Data Table Tab:**
- Paginated view of raw data
- Sortable columns
- Search and filter capabilities

### Step 3: Preprocess Data

1. Click "Continue to Preprocessing"
2. Configure preprocessing options:

**Missing Values:**
- Remove rows with missing values
- Fill with mean/median/mode
- Forward/backward fill

**Outlier Handling:**
- Remove outliers using IQR method
- Keep outliers

**Encoding:**
- Label encoding for ordinal categories
- One-hot encoding for nominal categories

**Scaling:**
- Standardization (mean=0, std=1)
- Normalization (min-max scaling)
- No scaling

3. Preview changes before applying
4. Click "Apply Preprocessing"
5. Review preprocessing summary:
   - Removed rows count
   - Final dataset size
   - Encoded features
   - Scaled features

### Step 4: Train ML Model

1. Click "Continue to Model Training" (appears after preprocessing)
2. Select a model type:
   - Choose based on your problem (regression/classification/clustering)
   - Read descriptions for each model
   - Consider "Best For" suggestions

3. Configure model:
   - **Target Column**: What you want to predict
   - **Feature Columns**: Select predictors (check multiple)
   - **Test Size**: Adjust slider (10-40%)

4. Click "Start Training"
5. Wait for training to complete (progress bar shows status)

6. Review results:
   - **Performance Metrics**: R², MSE, RMSE, MAE
   - **Feature Importance**: Which features matter most
   - **Training Time**: Model efficiency
   - **Test Accuracy**: Model performance

### Step 5: Export Results

Click "Export" button in the header to download:
- Analysis report (JSON format)
- Statistics and insights
- Preprocessing configuration
- Model results

## Database Structure

### Tables

**datasets**
- `id`: UUID primary key
- `name`: Dataset name
- `description`: Optional description
- `data`: JSONB array of records
- `column_info`: Column metadata
- `row_count`: Number of rows
- `created_at`: Timestamp

**analysis_results**
- `id`: UUID primary key
- `dataset_id`: Foreign key to datasets
- `statistics`: Computed statistics
- `insights`: Generated insights
- `created_at`: Timestamp

**preprocessing_results**
- `id`: UUID primary key
- `dataset_id`: Foreign key to datasets
- `config`: Preprocessing configuration
- `removed_rows`: Count of removed rows
- `encodings`: Encoding mappings
- `scaling_params`: Scaling parameters
- `created_at`: Timestamp

**ml_models**
- `id`: UUID primary key
- `dataset_id`: Foreign key to datasets
- `model_type`: Algorithm used
- `config`: Model configuration
- `metrics`: Performance metrics
- `feature_importance`: Feature weights
- `train_time`: Training duration
- `test_accuracy`: Model accuracy
- `created_at`: Timestamp

## Project Structure

```
project/
├── src/
│   ├── components/         # React components
│   │   ├── CompactAnalysis.tsx      # Main analysis dashboard
│   │   ├── CorrelationMatrix.tsx    # Correlation heatmap
│   │   ├── DataTable.tsx            # Data grid view
│   │   ├── DataUpload.tsx           # File upload component
│   │   ├── DataVisualization.tsx    # Charts and graphs
│   │   ├── InsightsPanel.tsx        # Insights display
│   │   ├── ModelTraining.tsx        # ML training interface
│   │   ├── PreprocessingPanel.tsx   # Preprocessing config
│   │   ├── Recommendations.tsx      # Action suggestions
│   │   ├── SmartSummary.tsx         # Dataset summary
│   │   └── StatisticsPanel.tsx      # Statistical analysis
│   │
│   ├── utils/              # Utility functions
│   │   ├── dataAnalysis.ts          # EDA algorithms
│   │   ├── modeling.ts              # ML implementations
│   │   ├── preprocessing.ts         # Data cleaning
│   │   └── validation.ts            # Input validation
│   │
│   ├── lib/
│   │   └── supabase.ts             # Database client
│   │
│   ├── App.tsx             # Main application
│   ├── index.css           # Global styles
│   └── main.tsx            # Entry point
│
├── supabase/
│   └── migrations/         # Database migrations
│
├── dist/                   # Production build
├── package.json           # Dependencies
└── vite.config.ts         # Vite configuration
```

## Styling Guide

### Color Palette
- **Primary**: Blue (500-600) and Cyan (500-600)
- **Secondary**: Emerald/Teal for success states
- **Warning**: Amber/Orange for warnings
- **Error**: Red/Rose for errors
- **Neutral**: Slate for backgrounds and text

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1536px
- **Large Desktop**: > 1536px

### Animation Classes
- `.animate-fade-in`: Fade in effect (0.5s)
- `.animate-slide-up`: Slide up from bottom (0.6s)
- `.animate-scale-in`: Scale in effect (0.4s)
- `.animate-pulse-slow`: Slow pulse animation (3s)

### Component Classes
- `.button-primary`: Primary action button with gradient
- `.button-secondary`: Secondary button with border
- `.input-field`: Form input with focus states
- `.stat-card`: Statistics card with hover effects
- `.section-card`: Main content card with glass effect
- `.glass-effect`: Frosted glass morphism effect

## Troubleshooting

### Build Issues

**Problem**: `border-border class does not exist`
**Solution**: Already fixed in the codebase. Run `npm run build` again.

**Problem**: `caniuse-lite is outdated`
**Solution**: Run `npx update-browserslist-db@latest`

### Upload Issues

**Problem**: "No valid data found in file"
**Solution**: Ensure CSV has headers and at least one data row

**Problem**: File not uploading
**Solution**: Check file size (< 10MB recommended) and format (must be .csv)

### Analysis Issues

**Problem**: Missing visualizations
**Solution**: Ensure dataset has at least one numeric column

**Problem**: Correlation matrix empty
**Solution**: Need at least 2 numeric columns for correlations

### Model Training Issues

**Problem**: "No numeric columns found"
**Solution**: Dataset must contain numeric columns for ML

**Problem**: Training fails
**Solution**:
- Ensure sufficient data (minimum 10 rows)
- Select at least one feature
- Choose appropriate model for your data type

### Database Issues

**Problem**: Data not saving
**Solution**: Check browser console for errors. Supabase connection is pre-configured.

## Performance Tips

1. **Large Datasets**: Files > 5MB may take longer to process
2. **Model Selection**: Start with Linear/Logistic Regression for baseline
3. **Feature Selection**: More features ≠ better model. Select relevant ones.
4. **Test Size**: 20% is a good default for most datasets
5. **Preprocessing**: Always handle missing values before training

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

This is an automated data analysis tool. For improvements:
1. Follow the existing code style
2. Maintain TypeScript types
3. Test on multiple browsers
4. Ensure responsive design
5. Update documentation

## License

MIT License - Feel free to use this project for learning and development.

## Support

For issues or questions, please check the troubleshooting section first or open an issue in the repository.

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and Supabase**
