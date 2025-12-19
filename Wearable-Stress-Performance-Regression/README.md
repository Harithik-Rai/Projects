# Wearable Stress and Academic Performance Analysis

## Overview
This project explores the relationship between physiological stress signals collected from wearable devices and academic performance during university exams. Using real-world biometric data, the goal is to understand whether patterns of stress (particularly short-term responses) are associated with exam outcomes.

The project emphasizes **interpretability**, **real data handling**, and **responsible modeling** rather than overfitting or unrealistic performance claims. All analysis is conducted using industry-standard data science practices with proper validation techniques.


## Dataset
The analysis uses the **Wearable Exam Stress Dataset**, which contains physiological data collected from wearable sensors worn by students during exams:

**Source**: [PhysioNet - Wearable Exam Stress Dataset](https://physionet.org/content/wearable-exam-stress/1.0.0/)

**Dataset Characteristics:**
- **Participants**: 10 university students
- **Exams**: 3 sessions per student (Midterm 1, Midterm 2, Final)
- **Total Observations**: 30 student-exam combinations

**Physiological Signals:**
- Electrodermal Activity (EDA) - skin conductance
- Heart Rate (HR)
- Skin Temperature
- Motion (Accelerometer)

**Performance Data:**
- Exam grades (Midterm 1/2: 0-100 points, Final: 0-200 points)

Each participant completed multiple exams, allowing physiological signals to be paired with performance outcomes.


## Feature Engineering
To make the physiological data interpretable and suitable for modeling, the raw EDA signals were summarized into exam-level features:

| Feature | Description | Interpretation |
|---------|-------------|----------------|
| **EDA Mean** | Average skin conductance | Baseline stress level during the exam |
| **EDA Standard Deviation** | Variability in EDA signal | Stress response variability |
| **EDA 95th Percentile** | High-intensity values | Peak stress moments |
| **EDA Peak Count** | Frequency of acute spikes | Acute stress response episodes |
| **EDA Trend** | Linear slope over time | Overall stress progression (increasing/decreasing) |

These features were aggregated per student per exam and merged with the corresponding grades to create a supervised learning dataset.

**Signal Processing:**
- Peak detection using `scipy.signal.find_peaks`
- Trend analysis using linear regression (numpy.polyfit)
- Statistical aggregation (mean, std, percentiles)


## Modeling Approach
A **linear regression model** was used to predict exam grades from EDA-derived stress features, prioritizing interpretability over complexity.

**Pipeline:**
1. **Feature Standardization**: `StandardScaler` to normalize features (zero mean, unit variance)
2. **Model Training**: Linear regression for coefficient interpretability
3. **Validation**: **Leave-One-Out Cross-Validation (LOOCV)** due to small sample size
4. **Evaluation Metric**: **Root Mean Squared Error (RMSE)** in grade points


## Results

### Model Performance
- **Mean LOOCV RMSE**: ~21.4 ± 14.4 points
- **Interpretation**: Model captures general performance trends but exhibits high variance due to limited data

### Key Findings
1. **Acute Stress Responses (EDA Peak Count)**: Strongest positive predictor
   - More frequent stress spikes associated with higher grades
   - Suggests active cognitive engagement during exams

2. **Baseline Stress (EDA Mean)**: Negative association
   - Higher average stress linked to lower performance
   - Consistent with Yerkes-Dodson arousal theory

3. **Model Behavior**: 
   - Captures mid-range grades effectively
   - Predictions regress toward mean for extreme values
   - No systematic bias in residuals


## Visualization & Key Insights

### EDA Peak Count vs. Exam Grade
The scatter plot below shows a **non-random relationship** between acute stress responses and performance:

<img width="636" height="470" alt="EDA Peak Count vs Exam Performance" src="https://github.com/user-attachments/assets/722914f2-2286-4d5b-8536-20eac3f1b20d" />

**Interpretation:**
- Students with more frequent stress spikes show diverse outcomes
- Relationship is complex and individual-specific
- Suggests stress-performance dynamics are non-linear and context-dependent

**Note**: Correlation does not imply causation. Peak count may reflect exam difficulty, student effort, or adaptive stress responses rather than directly causing performance changes.


## Technologies Used

**Core Libraries:**
- `pandas` - Data manipulation and cleaning
- `numpy` - Numerical computations
- `scikit-learn` - Machine learning pipeline and validation
- `scipy` - Signal processing (peak detection, statistical tests)

**Visualization:**
- `matplotlib` - Static plotting
- `seaborn` - Statistical visualizations

**Development Environment:**
- Jupyter Notebook / VS Code
- Python 3.8+


## Project Structure
```
wearable-stress-analysis/
├── notebook/
│   └── stress_performance_analysis.ipynb  # Main analysis notebook
├── data/
│   └── raw/                                # Original dataset
│       ├── Data/                           # Participant wearable data
│       └── StudentGrades.txt               # Exam scores
├── README.md
└── LICENSE
```


## Getting Started

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/wearable-stress-analysis.git
cd wearable-stress-analysis
```

2. Install any dependencies

3. Download the dataset:
   - Visit [PhysioNet - Wearable Exam Stress Dataset](https://physionet.org/content/wearable-exam-stress/1.0.0/)
   - Extract to `data/raw/` directory

4. Run the analysis:
```bash
jupyter notebook notebooks/stress_performance_analysis.ipynb
```


## Project Goals & Skills Demonstrated

This project demonstrates the ability to:

✅ **Data Engineering**: Handle messy, real-world biomedical time-series data  
✅ **Feature Engineering**: Transform raw signals into interpretable domain-specific features  
✅ **Statistical Rigor**: Apply appropriate validation techniques (LOOCV)   
✅ **Critical Thinking**: Acknowledge limitations and avoid over-interpretation  
✅ **Professional Communication**: Present results clearly with proper scientific context  
