# HOW TO RUN IN TERMINAL: python -m streamlit run app.py

import io
import textwrap
from datetime import date

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import streamlit as st

st.set_page_config(page_title="Personal Finance Dashboard", layout="wide")


# Sample data
SAMPLE_CSV = textwrap.dedent("""\
Date,Category,Amount,Note
2025-01-01,Groceries,120.50,Supermarket
2025-01-02,Rent,950.00,January rent
2025-01-03,Entertainment,45.00,Movie night
2025-01-05,Transport,60.00,Subway pass
2025-01-07,Groceries,80.00,Groceries
2025-01-10,Utilities,130.00,Hydro
2025-01-12,Entertainment,100.00,Concert
2025-01-15,Rent,950.00,Mid-month rent (example)
2025-01-18,Transport,50.00,Uber
2025-01-20,Savings,300.00,Transfer to savings
""")

def load_sample_dataframe() -> pd.DataFrame:
    df = pd.read_csv(io.StringIO(SAMPLE_CSV), parse_dates=["Date"])
    return df


# Sidebar: data input
st.sidebar.header("Data")
uploaded = st.sidebar.file_uploader("Upload transactions CSV", type=["csv"])

use_sample = st.sidebar.checkbox("Use sample data", value=uploaded is None)

if uploaded:
    df = pd.read_csv(uploaded, parse_dates=True)
elif use_sample:
    df = load_sample_dataframe()
else:
    st.stop()


# Column mapping (robust to different CSV schemas)
st.sidebar.header("Column Mapping")

# Best guesses
candidate_date_cols = [c for c in df.columns if "date" in c.lower()] or list(df.columns)
candidate_cat_cols  = [c for c in df.columns if "cat" in c.lower()] or list(df.columns)
candidate_amt_cols  = [c for c in df.columns if "amount" in c.lower() or "amt" in c.lower() or "value" in c.lower()] or list(df.columns)

col_date = st.sidebar.selectbox("Date column", candidate_date_cols, index=0)
col_cat  = st.sidebar.selectbox("Category column", candidate_cat_cols, index=1 if len(candidate_cat_cols) > 1 else 0)
col_amt  = st.sidebar.selectbox("Amount column", candidate_amt_cols, index=2 if len(candidate_amt_cols) > 2 else 0)

# Clean / standardize
df = df.rename(columns={col_date: "Date", col_cat: "Category", col_amt: "Amount"}).copy()
# Parse dates safely
if not np.issubdtype(df["Date"].dtype, np.datetime64):
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
df = df.dropna(subset=["Date"])

# Ensure numeric amounts
df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce")
df = df.dropna(subset=["Amount"])

# Category hygiene
df["Category"] = df["Category"].astype(str).str.strip()


# Sidebar: filters & options
st.sidebar.header("Filters")

min_d, max_d = df["Date"].min().date(), df["Date"].max().date()
date_range = st.sidebar.date_input("Date range", value=(min_d, max_d), min_value=min_d, max_value=max_d)
if isinstance(date_range, tuple):
    start_d, end_d = date_range
else:  # single date widget fallback
    start_d, end_d = date_range, date_range

mask = (df["Date"].dt.date >= start_d) & (df["Date"].dt.date <= end_d)
df = df.loc[mask].copy()

categories = sorted(df["Category"].unique().tolist())
selected_cats = st.sidebar.multiselect("Categories", categories, default=categories)
df = df[df["Category"].isin(selected_cats)].copy()

granularity = st.sidebar.radio("Time granularity", ["Daily", "Monthly"], index=0)
roll_window = st.sidebar.slider("Rolling average (days, for line chart)", min_value=1, max_value=30, value=7)

st.sidebar.caption("Tip: Use 'Monthly' when the range goes across many months.")


# Layout
st.title("💸 Personal Finance Dashboard")
st.write(
    "Upload your CSV (or use sample data), choose your date range and categories, "
    "then explore your spending patterns with clear visuals."
)

with st.expander("Please see expected CSV format"):
    st.markdown(
        """
        **Minimum columns:**  
        - `Date` (any parseable date format)  
        - `Category` (e.g., Groceries, Rent)  
        - `Amount` (number; positive for spending)  
        """
    )
    st.code(SAMPLE_CSV, language="csv")


# Aggregations
df = df.sort_values("Date")
df["Amount"] = df["Amount"].astype(float)

if granularity == "Daily":
    grp = df.groupby(df["Date"].dt.date)["Amount"].sum()
else:
    grp = df.groupby(df["Date"].dt.to_period("M"))["Amount"].sum()
    grp.index = grp.index.to_timestamp()

category_totals = df.groupby("Category")["Amount"].sum().sort_values(ascending=False)

# Cumulative (by actual transaction order within filtered set)
df["Cumulative"] = df["Amount"].cumsum()

# Rolling average (on the grouped series)
roll = grp.rolling(roll_window, min_periods=1).mean()


# Row 1: Line chart (trend + rolling)
col1, col2 = st.columns([2, 1], gap="large")

with col1:
    st.subheader("Spending Trend")
    fig1, ax1 = plt.subplots(figsize=(8, 4))
    ax1.plot(grp.index, grp.values, marker="o", linewidth=2, label="Spending")
    ax1.plot(roll.index, roll.values, linestyle="--", linewidth=2, label=f"Rolling avg ({roll_window})")
    ax1.set_title("Total Spending Over Time")
    ax1.set_xlabel("Date")
    ax1.set_ylabel("Total Spending")
    ax1.grid(True)
    ax1.legend()
    fig1.autofmt_xdate()
    plt.tight_layout()
    st.pyplot(fig1, clear_figure=True)

with col2:
    st.subheader("Spending by Category")
    if len(category_totals) > 0:
        fig2, ax2 = plt.subplots(figsize=(4.5, 4.5))
        ax2.pie(category_totals.values, labels=category_totals.index, autopct="%1.1f%%", startangle=90)
        ax2.set_title("Category Breakdown")
        plt.tight_layout()
        st.pyplot(fig2, clear_figure=True)
    else:
        st.info("No data for the selected filters.")


# Row 2: Cumulative & Table
c3, c4 = st.columns([2, 1], gap="large")

with c3:
    st.subheader("Cumulative Spending")
    fig3, ax3 = plt.subplots(figsize=(8, 4))
    ax3.plot(df["Date"], df["Cumulative"], marker="o", linewidth=2)
    ax3.set_title("Cumulative Spending Over Time")
    ax3.set_xlabel("Date")
    ax3.set_ylabel("Cumulative Spending")
    ax3.grid(True)
    fig3.autofmt_xdate()
    plt.tight_layout()
    st.pyplot(fig3, clear_figure=True)

with c4:
    st.subheader("Top Categories")
    top_table = category_totals.reset_index()
    top_table.columns = ["Category", "Total"]
    # Format Total with $ symbol
    top_table["Total"] = top_table["Total"].apply(lambda x: f"${x:,.2f}")
    st.dataframe(top_table, use_container_width=True)


# Download
st.subheader("Download filtered data")
csv_bytes = df.to_csv(index=False).encode("utf-8")
st.download_button("Download CSV", data=csv_bytes, file_name="filtered_transactions.csv", mime="text/csv")

st.caption("All charts are created utilizing matplotlib. Try functionalities like changing granularity, rolling average, and categories to explore your data further.")
