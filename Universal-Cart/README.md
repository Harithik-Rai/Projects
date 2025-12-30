# Universal Cart (Chrome Extension)

## Overview
Universal Cart is a Chrome extension that allows users to add products from multiple e-commerce websites into a single, unified shopping cart.

It streamlines the online shopping experience by eliminating the need to manage multiple carts across different platforms, making it easier to compare and track items in one place.


## Features
- Add products from supported e-commerce sites into a universal cart  
- Automatically extracts product details (title, price, image, URL) using DOM parsing and regex  
- Aggregates items into a clean, easy-to-manage popup interface  
- Clickable product links to quickly return to the original product page  


## Tech Stack
- JavaScript  
- HTML / CSS  
- Chrome Extension APIs  
- VS Code  


## How to Use

### 1. Project Setup
Ensure your local folder matches the file structure shown above.

### 2. Load the Extension in Chrome
1. Open Chrome and navigate to:  
   `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `Universal-Cart` folder

The extension will now appear in your extensions list.


### 3. Using the Extension
1. Navigate to a product page on an e-commerce website  
2. Click the **"Add to Cart"** button in the extension popup  
3. The product will appear in the universal cart with:
   - Image
   - Title
   - Price
   - Clickable URL to the original product page


## Technical Highlights
- **JavaScript**: Implemented core extension logic, including DOM parsing for product data extraction, event handling for user interactions, and Chrome API messaging between content scripts, the popup, and the background service worker.
- **HTML**: Structured the extension popup layout to clearly display product information such as images, titles, prices, and links.
- **CSS**: Styled the popup interface to be clean, readable, and responsive within Chrome extension size constraints.
- **Chrome Extension APIs**: Used `content scripts` to extract product data from web pages, `background scripts` to manage shared state, and `manifest.json` to configure permissions and extension behavior.


## Notes & Limitations
- Product extraction relies on page structure and may vary between sites  
- Designed as a proof-of-concept focusing on extensibility and core functionality  



