# 3D Modeling — Introductory Ray Tracing Demos

## Overview
This project implements a collection of simple **ray tracing experiments in C++**.  
It demonstrates the core principles of rendering geometry with **ray–object intersections, projection models, and shading techniques**.  

Each demo generates a PNG image showing a different rendering concept:
- Sphere with orthographic projection  
- Parallelogram with orthographic projection  
- Parallelogram with perspective projection  
- Sphere with Lambertian + Blinn-Phong shading  

## Features
- **Sphere intersection** under orthographic projection.  
- **Parallelogram intersection** with both orthographic and perspective cameras.  
- **Shading** using diffuse + specular reflection (Blinn-Phong).  
- Supports **orthographic** and **perspective** ray generation.  
- 🖼Outputs multiple PNG files (`sphere_orthographic.png`, `plane_orthographic.png`, `plane_perspective.png`, `shading.png`).  

## Tech Stack
- **C++**  
- **Eigen** (linear algebra for vectors and matrices)  
- **stb_image_write.h** (header-only PNG writer)  
- Custom utility header (`utils.h`) for saving matrices → PNG
