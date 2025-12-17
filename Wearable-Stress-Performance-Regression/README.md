# Wearable Stress and Academic Performance Prediction

## Overview
Can physiological stress signals collected from wearable devices predict academic performance during exams?  
This project analyzes electrodermal activity (EDA) data collected during midterms and finals and evaluates whether stress patterns are associated with exam outcomes.

## Dataset
The analysis uses a publicly available wearable exam stress dataset containing:
- Continuous physiological signals (EDA) recorded during exams
- Academic performance data for multiple students across exams

## Feature Engineering
Raw EDA signals were transformed into interpretable summary features, including:
- Baseline stress level (mean EDA)
- Stress variability (standard deviation)
- High-stress responses (95th percentile, peak count)
- Stress trend over time

## Modeling Approach
A linear regression model with standardized features was trained to predict exam grades.
Model performance was evaluated using leave-one-out cross-validation (LOOCV) with RMSE to ensure robust estimates on a small dataset.

## Results
The model achieved an average RMSE of approximately 21 points.
Coefficient analysis revealed that:
- Higher baseline stress was associated with lower grades
- Frequent acute stress responses (EDA peaks) were associated with higher performance

## Interpretation
The results suggest that not all stress is detrimental—moderate, engagement-related stress may be beneficial, while sustained baseline stress may hinder performance.

## Limitations & Future Work
- Small sample size
- Use of EDA only (no heart rate or respiration)
- No alignment with exam phases or question difficulty

Future work could incorporate additional physiological modalities and larger datasets.
