# 3D Modeling — PNG Generator (Ray Tracer)

## Overview
This project implements a **ray tracer in C++** that renders a scene of spheres and a ground parallelogram into a PNG image.  
The renderer demonstrates key computer graphics concepts: **ray-object intersection, lighting models, reflections, and procedural textures**.  

## Features
- Ray–sphere and ray–parallelogram intersections.  
- **Phong shading** with multiple light sources and ambient light.  
- Recursive **reflections** (configurable `max_bounce`).  
- **Procedural texture** using Perlin noise on one sphere.  
- Supports both **perspective** and **orthographic** cameras.  
- 🖼Saves rendered output as PNG via `stb_image_write`.  

## Tech Stack
- **C++**  
- **Eigen** (linear algebra for vectors and matrices)  
- **stb_image_write.h** (header-only PNG writer)  
- Custom utility header (`utils.h`) for image writing
- **CMake**
