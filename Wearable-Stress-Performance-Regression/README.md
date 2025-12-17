# Wearable Stress and Academic Performance Analysis

## Overview
This project explores the relationship between physiological stress signals collected from wearable devices and academic performance during university exams. Using real-world biometric data, the goal is to understand whether patterns of stress—particularly short-term responses—are associated with exam outcomes.

The project emphasizes interpretability, real data handling, and responsible modeling rather than overfitting or unrealistic performance claims.

---

## Dataset
The analysis uses the **Wearable Exam Stress Dataset**, which contains physiological data collected from wearable sensors worn by students during exams. The dataset includes:

- Electrodermal Activity (EDA)
- Heart Rate (HR)
- Skin Temperature
- Motion (Accelerometer)
- Exam grades (Midterm 1, Midterm 2, Final)

Each participant completed multiple exams, allowing physiological signals to be paired with performance outcomes.

---

## Feature Engineering
To make the physiological data interpretable and suitable for modeling, the raw EDA signals were summarized into exam-level features:

- **EDA Mean**: Baseline stress level during the exam
- **EDA Standard Deviation**: Variability in stress response
- **EDA 95th Percentile**: High-intensity stress responses
- **EDA Peak Count**: Frequency of acute stress responses
- **EDA Trend**: Overall increase or decrease in stress over time

These features were aggregated per student per exam and merged with corresponding grades.

---

## Modeling Approach
A linear regression model was used to predict exam grades from EDA-derived stress features.

- Features were standardized using `StandardScaler`
- Model evaluation used **Leave-One-Out Cross-Validation (LOOCV)** due to the small sample size
- Performance was measured using **Root Mean Squared Error (RMSE)** to maintain interpretability in grade units

---

## Results
The model achieved a **mean LOOCV RMSE of approximately 21 points**, reflecting the inherent variability in exam performance and the limited dataset size. While not intended for precise grade prediction, the model demonstrates that physiological stress features contain meaningful signal related to performance.

---

## Visualization & Key Insight
A scatter plot of **EDA peak count vs exam grade** reveals a non-random relationship between acute stress responses and performance.

The visualization suggests that the number of short-term electrodermal activity (EDA) peaks—indicative of moments of physiological stress—is related to exam performance in a complex way. Although the data is noisy and does not imply causation, students with more frequent stress responses show a wide range of outcomes, motivating further modeling to better understand how stress dynamics relate to academic results.

---

## Limitations & Future Work
- Small sample size limits predictive performance
- Only EDA features were modeled; incorporating heart rate variability and motion data could improve results
- Future work could explore non-linear models, temporal modeling, or personalized baselines

---

## Technologies Used
- Python
- Pandas, NumPy
- scikit-learn
- Matplotlib
- Jupyter / VS Code

---

## Project Goal
This project demonstrates the ability to:
- Work with messy real-world biomedical data
- Engineer interpretable features from time-series signals
- Apply appropriate validation techniques
- Communicate results responsibly and clearly

The plot below illustrates the relationship between EDA peak frequency and exam grade, highlighting the complexity and nonlinearity of stress–performance dynamics.
<img width="636" height="470" alt="image" src="https://github.com/user-attachments/assets/722914f2-2286-4d5b-8536-20eac3f1b20d" />
