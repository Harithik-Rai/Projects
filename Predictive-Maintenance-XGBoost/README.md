# Predictive Maintenance: Remaining Useful Life (RUL) Modeling

## Overview
This project focuses on predicting the **Remaining Useful Life (RUL)** of turbofan engines using multivariate time-series sensor data. The goal is to estimate how many operational cycles remain before engine failure, a core problem in **predictive maintenance** and reliability engineering.

The analysis emphasizes **realistic data handling**, **careful feature engineering**, and **robust model evaluation**, avoiding data leakage and overly optimistic performance claims. The project follows industry-aligned practices for time-series modeling in maintenance and operational settings.


## Dataset
The project uses the **NASA CMAPSS Turbofan Engine Degradation Simulation Dataset**, a widely used benchmark for predictive maintenance research.

**Source**: [Turbofan Engine Degradation Simulation Dataset](https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/)

**Dataset Characteristics:**
- **Engines**: 100 simulated turbofan engines (FD001 subset)
- **Operating Conditions**: Single operating condition
- **Sensors**: 21 continuous sensor measurements per engine
- **Target Variable**: Remaining Useful Life (RUL), measured in cycles

Each engine operates normally at the start and gradually degrades until failure, enabling full life-cycle analysis.


## Exploratory Data Analysis
Initial analysis was performed to understand engine lifetimes, sensor behavior, and degradation patterns.

Key steps included:
- Computing engine-level RUL labels from operational cycles
- Analyzing RUL distributions across engines
- Evaluating sensor variance and degradation trends
- Removing low-variance and non-informative sensors based on empirical analysis and domain literature

This step ensured that only meaningful sensor signals were carried forward into modeling.


## Feature Engineering
To capture degradation behavior over time, rolling-window statistical features were engineered from the raw sensor signals.

**Feature Strategy:**
- Rolling mean and standard deviation
- Window-based smoothing to reduce noise
- Feature aggregation aligned with temporal degradation patterns

These features transform raw time-series data into structured inputs suitable for supervised learning while preserving temporal information.


## Modeling Approach
A supervised regression framework was used to predict Remaining Useful Life.

**Model Used:**
- **XGBoost Regression**, chosen for its ability to model non-linear relationships and handle correlated features

**Validation Strategy:**
- **Engine-wise train/validation split** to prevent data leakage
- No overlap of engine units between training and validation sets
- RUL capping applied to stabilize early-life predictions

**Evaluation Metrics:**
- Root Mean Squared Error (RMSE)
- Mean Absolute Error (MAE)
- R² Score

This setup reflects realistic deployment scenarios where predictions must generalize to unseen engines.


## Results

### Model Performance
- **RMSE**: ~15 cycles  
- **MAE**: ~11–12 cycles  
- **R²**: ~0.9  

**Interpretation:**
- The model predicts late-life degradation more accurately than early-life stages, which is expected in capped RUL settings
- Performance aligns with reported benchmarks for FD001 under comparable modeling assumptions
- Results indicate the model captures meaningful degradation signals without overfitting


## Key Insights
1. **Sensor relevance varies significantly**: Only a subset of sensors contributes meaningful degradation information
2. **Rolling-window features are critical**: Temporal aggregation improves stability and predictive performance
3. **Engine-wise validation is essential**: Random splits significantly overestimate performance in this domain


## Technologies Used

**Core Libraries:**
- `pandas` – Data manipulation and preprocessing  
- `numpy` – Numerical computations  
- `scikit-learn` – Validation, metrics, and data splitting  
- `xgboost` – Gradient boosting regression model  

**Visualization:**
- `matplotlib`
- `seaborn`

**Development Environment:**
- Python 3.8+
- Jupyter Notebook


## Project Structure
```
Predictive-Maintenance-RUL/
├── notebooks/
│   └── 01_eda_clean.ipynb
│   └── 02_modeling_xgboost.ipynb
├── data/
│   └── raw/
│     └── CMAPSSData/
│   └── processed/
│     └── fd001_clean.csv
├── figures/
├── requirments.txt
└── README.md
```


## Getting Started

### Installation
1. Clone the repository:
```bash
git clone https://github.com/Harithik-Rai/Projects/Predictive-Maintenance-XGBoost.git
cd wearable-stress-analysis
```

2. Install dependencies:
   
   pip install -r requirements.txt

3. Download the dataset:
   - Visit [Turbofan Engine Degradation Simulation Dataset](https://www.nasa.gov/intelligent-systems-division/discovery-and-systems-health/pcoe/pcoe-data-set-repository/)
   - Extract to `data/raw/` directory

4. Run the analysis:
```bash
jupyter notebook notebooks/01_eda_clean.ipynb
jupyter notebook notebooks/02_modeling_xgboost.ipynb
```


## Project Goals & Skills Demonstrated

This project demonstrates the ability to:

**Time-Series Analysis**: Work with multivariate degradation data 
**Feature Engineering**: Extract meaningful temporal patterns from raw sensor signals  
**Model Evaluation**: Apply leakage-safe validation strategies 
**Applied Machine Learning**: Build models aligned with real-world constraints
**Professional Communication**: Clearly document assumptions, results, and limitations

