📊 Stress and Academic Performance Analysis
Dataset

This project uses the Wearable Exam Stress Dataset, which contains physiological signals collected from wearable devices during university exams. Signals include electrodermal activity (EDA), heart rate, temperature, and motion data, paired with exam performance outcomes.

Approach

Extracted interpretable stress features from EDA signals, including:

Mean activation

Variability

High-percentile responses

Acute stress peak frequency

Temporal stress trends

Aggregated physiological features per student and exam

Modeled exam performance using linear regression with leave-one-out cross-validation

Evaluated performance using RMSE to ensure interpretability in grade units

Key Insight

Exploratory analysis revealed that acute stress responses (EDA peaks) exhibit a meaningful association with exam performance. Rather than being purely detrimental, short-term physiological stress may reflect engagement or cognitive activation during high-stakes evaluations.

Visualization

The plot below illustrates the relationship between EDA peak frequency and exam grade, highlighting the complexity and nonlinearity of stress–performance dynamics.

<img width="636" height="470" alt="image" src="https://github.com/user-attachments/assets/722914f2-2286-4d5b-8536-20eac3f1b20d" />
