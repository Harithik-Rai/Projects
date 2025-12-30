# Universal Cart (Chrome Extension)

## Overview
Universal Cart is a Chrome extension that lets users add products from multiple e-commerce sites into a single shopping cart. 
It streamlines the online shopping experience by eliminating the need to manage multiple carts across different platforms.

## Features
- Add products from any supported site directly to a universal cart.  
- Automatically extracts product details (title, price, image) using DOM parsing and regex.  
- Aggregates items into a clean, easy-to-manage interface.  
- Works across top e-commerce sites.  

## Tech Stack
- JavaScript  
- HTML/CSS  
- Chrome APIs  
- VSCode 

## How to Use:
1) Inside the folder you should have the same struture of files that are in this GitHub repo.

2) Load the Extension in Chrome
Open Chrome and go to:
chrome://extensions

Enable Developer Mode (toggle in top-right corner)

Click "Load unpacked" button

Select your universal-cart folder

The extension will now appear in your extensions list and is now usable!

3) To use it you simply go to a product on an online website and click the "Add to cart" button at the top of the extension,
it will then appear in the cart showing the image, price, title, and cilckable URL to get back to the product site.

*This is still a work in progress and rarely some sites may not work due to having strict privacy settings.
