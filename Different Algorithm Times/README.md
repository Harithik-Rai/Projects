# Sorting Algorithms Runtime Comparison

## Overview
This project implements and compares the runtime performance of three sorting algorithms:  
- **Blind Sort** (basic/naïve approach)  
- **Insertion Sort** (O(n²) average-case algorithm)  
- **Merge Sort** (O(n log n) divide-and-conquer algorithm)  

Each algorithm is tested on arrays with different initial states:  
- **Sorted**  
- **Unsorted**  
- **Randomized**  

By running the algorithms and analyzing their runtimes, the project highlights how **algorithmic complexity** and **input characteristics** affect execution time.

## Features
- Implementations of **Blind**, **Insertion**, and **Merge** sort in Java.  
- Runtime testing on different array states (sorted, unsorted, random).  
- Includes a **runtime histogram** (`Histogram of Runtimes.png`) to visualize performance differences.  
- Clear comparison of efficiency between O(n²) and O(n log n) sorting approaches.  

## Tech Stack
- **Java** (core implementation)  
- **JVM timing functions** for runtime measurement  
- **PNG visualization** of runtimes  
