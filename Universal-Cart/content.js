// Connection manager (unchanged)
let isAlive = true;
const connectionInterval = setInterval(verifyConnection, 30000);

function verifyConnection() {
  chrome.runtime.sendMessage({type: "ping"}, (response) => {
    if (chrome.runtime.lastError || !response) {
      isAlive = false;
      clearInterval(connectionInterval);
    }
  });
}

// Initialize connection (unchanged)
chrome.runtime.sendMessage({type: "contentScriptReady"}, (response) => {
  if (chrome.runtime.lastError) {
    console.log("Initial connection failed, will retry...");
    setTimeout(() => chrome.runtime.sendMessage({type: "contentScriptReady"}), 1000);
  }
});

// Cleanup on tab close (unchanged)
window.addEventListener('unload', () => {
  clearInterval(connectionInterval);
});

// Message handler (unchanged)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!isAlive) {
    sendResponse({success: false, error: "Content script disconnected"});
    return;
  }

  if (request.type === "ping") {
    sendResponse({type: "pong", status: "ready"});
    return;
  }

  if (request.action === "scrapeItem") {
    (async () => {
      try {
        if (!request.url || !request.url.startsWith('http')) {
          throw new Error(`Invalid URL: ${request.url}`);
        }
        
        const item = await scrapeItemInfo(request.url);
        sendResponse({success: true, item});
      } catch (error) {
        console.error('Scraping failed:', error);
        sendResponse({
          success: false,
          error: error.message,
          stack: error.stack
        });
      }
    })();
    return true;
  }
});

// Enhanced scraping function with multiple validation
async function scrapeItemInfo(url) {
  try {
    const title = await getProductTitle();
    const price = await getConsensusPrice();
    const image = await getProductImage();

    return {
      title: title,
      price: price,
      image: image,
      url: url
    };
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  }
}

// Enhanced title extraction with Amazon-specific detection
async function getProductTitle() {
  // Amazon-specific title detection first
  try {
    // Amazon's main product title
    const amazonTitle = document.querySelector('#productTitle, #title');
    if (amazonTitle && amazonTitle.textContent.trim()) {
      return cleanTitle(amazonTitle.textContent.trim());
    }

    // Amazon's alternative title locations
    const amazonAltTitle = document.querySelector('.a-size-large.product-title-word-break, .qa-title-text');
    if (amazonAltTitle && amazonAltTitle.textContent.trim()) {
      return cleanTitle(amazonAltTitle.textContent.trim());
    }

    // Amazon's structured data
    const amazonScript = document.querySelector('script[type="a-state"]');
    if (amazonScript) {
      try {
        const data = JSON.parse(amazonScript.textContent);
        if (data.title) {
          return cleanTitle(data.title);
        }
        if (data.product && data.product.title) {
          return cleanTitle(data.product.title);
        }
      } catch (e) {
        console.warn('Amazon JSON parse error:', e);
      }
    }

    // Amazon's JSON-LD data
    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    if (jsonLdScript) {
      try {
        const data = JSON.parse(jsonLdScript.textContent);
        if (data.name) {
          return cleanTitle(data.name);
        }
      } catch (e) {
        console.warn('Amazon JSON-LD parse error:', e);
      }
    }
  } catch (e) {
    console.warn('Amazon-specific title detection failed:', e);
  }

  // Original title detection strategies (unchanged)
  const titleSources = [
    () => document.querySelector('h1')?.textContent?.trim(),
    () => document.querySelector('[itemprop="name"]')?.textContent?.trim(),
    () => document.querySelector('.product-title, .product__title')?.textContent?.trim(),
    () => document.querySelector('title')?.textContent?.trim(),
    () => document.querySelector('meta[property="og:title"]')?.content?.trim(),
    () => document.querySelector('meta[name="twitter:title"]')?.content?.trim()
  ];

  for (const source of titleSources) {
    try {
      const title = source();
      if (title && title.length > 0) {
        return cleanTitle(title);
      }
    } catch (e) {
      console.warn('Title extraction failed:', e);
    }
  }

  return 'Product from ' + new URL(location.href).hostname;
}

// Helper function to clean up titles
function cleanTitle(title) {
  if (!title) return title;
  
  // Amazon-specific cleaning
  let cleaned = title
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/^Amazon\.ca:/, '') // Remove Amazon prefix
    .replace(/\[.*?\]/g, '') // Remove brackets and contents
    .replace(/\(.*?\)/g, '') // Remove parentheses and contents
    .replace(/\b(?:Brand:\s*|Model:\s*|Style:\s*).*$/i, '') // Remove trailing metadata
    .replace(/\b(?:Visit\s+the\s+\w+\s+Store\b).*$/i, '') // Remove store references
    .replace(/\b(?:Renewed|Refurbished|Premium|Certified)\b/gi, '') // Remove condition tags
    .trim();
  
  // Ensure we don't return empty string
  if (!cleaned || cleaned.length === 0) {
    cleaned = title.substring(0, 200).trim(); // Fallback to original if cleaned is empty
  }
  
  return cleaned.substring(0, 200); // Limit length
}

function normalizePrice(price) {
  if (!price) return null;

  // Convert to string if it's a number
  if (typeof price === 'number') {
    return `$${price.toFixed(2)}`;
  }

  let priceStr = price.toString().trim();
  const currency = (priceStr.match(/^([\$£€¥]|USD|CAD|GBP|EUR)/) || ['$'])[0];
  
  // Extract all numbers including decimals/commas
  const numberMatch = priceStr.match(/([\d,.]+)/);
  if (!numberMatch) return null;
  
  let numericStr = numberMatch[0];
  
  // Determine if this is likely a European format (1.000,99)
  const isEuropeanFormat = numericStr.includes('.') && 
                          numericStr.includes(',') && 
                          numericStr.match(/\.\d{3},\d{2}$/);
  
  // Clean the number string
  if (isEuropeanFormat) {
    numericStr = numericStr.replace(/\./g, '').replace(',', '.');
  } else {
    // Remove all non-digit characters except last period or comma
    const hasDecimalSeparator = numericStr.match(/[.,]\d+$/);
    numericStr = numericStr.replace(/[^\d.]/g, '');
    
    // If there was a decimal separator, restore it
    if (hasDecimalSeparator) {
      const parts = numericStr.split('.');
      if (parts.length > 1) {
        numericStr = parts[0] + '.' + parts.slice(1).join('');
      }
    }
  }

  // Convert to number
  const numericValue = parseFloat(numericStr);
  if (isNaN(numericValue)) return null;

  // Heuristics to determine if this is a misparsed price
  const isLikelyMisparsed = checkIfMisparsed(priceStr, numericValue);
  
  // Apply correction if needed
  const correctedValue = isLikelyMisparsed ? numericValue / 100 : numericValue;
  
  // Format with 2 decimal places
  const formattedValue = correctedValue.toFixed(2);
  
  return `${currency}${formattedValue}`;
}

function checkIfMisparsed(originalStr, numericValue) {
  // Heuristic 1: Price ends with two zeros after decimal in original string
  if (originalStr.match(/\.00$/)) return false;
  
  // Heuristic 2: Price is very large (>$10,000) but from a non-luxury site
  if (numericValue >= 10000 && !isLuxurySite()) return true;
  
  // Heuristic 3: Price has unusual number of digits (like 1990000)
  const digits = Math.floor(Math.log10(numericValue)) + 1;
  if (digits >= 5 && numericValue % 100 === 0) return true;
  
  // Heuristic 4: Price appears in context that suggests it's in cents
  const context = originalStr.toLowerCase();
  if (context.includes('cents') || context.includes('¢')) return true;
  
  return false;
}

function isLuxurySite() {
  const luxuryDomains = ['gucci', 'louisvuitton', 'chanel', 'dior', 'prada', 'hermes'];
  const currentDomain = window.location.hostname.toLowerCase();
  return luxuryDomains.some(domain => currentDomain.includes(domain));
}

// Price detection strategies
async function getStructuredDataPrice() {
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        
        for (const item of items) {
          if (item['@type'] === 'Product' || item['@type'] === 'Offer') {
            if (item.offers?.price) return item.offers.price;
            if (item.price) return item.price;
          }
          if (item.offers?.['@type'] === 'AggregateOffer') {
            if (item.offers.lowPrice) return item.offers.lowPrice;
            if (item.offers.highPrice) return item.offers.highPrice;
            if (item.offers.price) return item.offers.price;
          }
        }
      } catch (e) {
        console.warn('JSON-LD parse error:', e);
      }
    }
  } catch (e) {
    console.warn('Structured data search failed:', e);
  }
  return null;
}

function extractPriceFromElement(el) {
  // Check content attributes first
  const content = el.getAttribute('content') || 
                 el.getAttribute('data-price') || 
                 el.getAttribute('data-product-price');
  if (content) {
    const price = normalizePrice(content);
    if (price) return price;
  }
  
  // Then check text content
  const text = el.textContent;
  if (text) {
    const price = normalizePrice(text);
    if (price) return price;
  }
  
  return null;
}

async function getPriceFromMetaTags() {
  const metaSelectors = [
    'meta[property="product:price:amount"]',
    'meta[itemprop="price"]',
    'meta[name="price"]',
    'meta[property="og:price:amount"]'
  ];
  
  for (const selector of metaSelectors) {
    try {
      const meta = document.querySelector(selector);
      if (meta && meta.content) {
        const price = normalizePrice(meta.content);
        if (price) return price;
      }
    } catch (e) {
      console.warn(`Meta selector ${selector} failed:`, e);
    }
  }
  return null;
}

async function getPriceFromTextSearch() {
  try {
    // Search for price patterns in the entire document
    const pricePatterns = [
      /([\$£€¥]|USD|CAD|GBP|EUR)\s*[\d,]+\.?\d{0,2}/g,
      /[\d,]+\.?\d{0,2}\s*([\$£€¥]|USD|CAD|GBP|EUR)/g,
      /price:\s*([\$£€¥]|USD|CAD|GBP|EUR)\s*[\d,]+\.?\d{0,2}/gi
    ];
    
    for (const pattern of pricePatterns) {
      const matches = document.body.textContent.match(pattern);
      if (matches) {
        for (const match of matches) {
          const price = normalizePrice(match);
          if (price) return price;
        }
      }
    }
  } catch (e) {
    console.warn('Text search failed:', e);
  }
  return null;
}

async function getPriceFromHiddenInputs() {
  const inputSelectors = [
    'input[name="price"]',
    'input[id*="price"]',
    'input[class*="price"]'
  ];

  for (const selector of inputSelectors) {
    try {
      const input = document.querySelector(selector);
      if (input && input.value) {
        const price = normalizePrice(input.value);
        if (price) return price;
      }
    } catch (e) {
      console.warn(`Hidden input search failed for ${selector}:`, e);
    }
  }
  return null;
}

// Enhanced price extraction from text
function extractPriceFromText(text) {
  if (!text) return null;

  // Handle common price formats with currency symbols
  const currencyFormats = [
    /([\$£€¥]|USD|CAD|GBP|EUR)\s*([\d,]+\.?\d{0,2})/, // $19.99
    /([\d,]+\.?\d{0,2})\s*([\$£€¥]|USD|CAD|GBP|EUR)/, // 19.99$
    /([\$£€¥]|USD|CAD|GBP|EUR)([\d,]+)/,              // $19
    /([\d,]+)([\$£€¥]|USD|CAD|GBP|EUR)/               // 19$
  ];

  for (const format of currencyFormats) {
    const match = text.match(format);
    if (match) {
      const currency = match[1] || '$';
      const amount = (match[2] || match[1]).replace(/[^\d.]/g, '');
      return `${currency}${amount}`;
    }
  }

  // Handle decimal/comma formats
  const decimalFormats = [
    /(\d{1,3}(?:,\d{3})*\.\d{2})/,  // 1,000.00
    /(\d{1,3}(?:\.\d{3})*,\d{2})/,  // 1.000,00
    /(\d+\.\d{2})/,                 // 1000.00
    /(\d+,\d{2})/                   // 1000,00
  ];

  for (const format of decimalFormats) {
    const match = text.match(format);
    if (match) {
      let amount = match[0];
      // Convert European format to standard
      if (amount.includes('.') && amount.includes(',')) {
        amount = amount.replace('.', '').replace(',', '.');
      } else if (amount.includes(',')) {
        amount = amount.replace(',', '.');
      }
      return `$${amount}`;
    }
  }

  return null;
}

// Fallback price detection for complex sites
async function getPriceFromFallbackMethods() {
  // Method 1: Look for prices near product titles
  try {
    const titleEl = document.querySelector('h1, [itemprop="name"], .product-title');
    if (titleEl) {
      let sibling = titleEl.nextElementSibling;
      for (let i = 0; i < 3 && sibling; i++) {
        const price = extractPriceFromText(sibling.textContent);
        if (price) return price;
        sibling = sibling.nextElementSibling;
      }
    }
  } catch (e) {
    console.warn('Title-adjacent price search failed:', e);
  }

  // Method 2: Look for prices in the main content area
  try {
    const mainContent = document.querySelector('main, #main, .main-content, #content');
    if (mainContent) {
      const priceElements = mainContent.querySelectorAll('p, span, div');
      for (const el of priceElements) {
        const price = extractPriceFromText(el.textContent);
        if (price) return price;
      }
    }
  } catch (e) {
    console.warn('Main content price search failed:', e);
  }

  // Method 3: Look for the largest number that looks like a price
  try {
    const allText = document.body.textContent;
    const numberMatches = allText.match(/\d[\d,.]*\d/g) || [];
    const potentialPrices = numberMatches
      .map(num => {
        const cleanNum = num.replace(/[^\d.]/g, '');
        const value = parseFloat(cleanNum);
        return { text: num, value };
      })
      .filter(({ value }) => !isNaN(value) && value < 100000) // Filter out unrealistic prices
      .sort((a, b) => b.value - a.value); // Sort descending

    if (potentialPrices.length > 0) {
      return `$${potentialPrices[0].value.toFixed(2)}`;
    }
  } catch (e) {
    console.warn('Largest number search failed:', e);
  }

  return null;
}

async function getProductImage() {
  // Try multiple strategies with priority
  const strategies = [
    // 1. Structured data first (most reliable)
    getStructuredDataImage,
    
    // 2. Site-specific detection for major retailers
    getAmazonImage,
    getTargetImage,
    getWalmartImage,
    getBestBuyImage,
    getEtsyImage,
    getEbayImage,
    
    // 3. Common product image patterns
    getMetaTagImages,
    getGalleryImages,
    getZoomableImages,
    getLazyLoadedImages,
    
    // 4. Fallback strategies
    getLargestVisibleImage,
    getFirstLargeImageNearTitle,
    getImageFromProductContainer,
    getPictureTagImage
  ];

  // Try each strategy in order until we find a valid image
  for (const strategy of strategies) {
    try {
      const imageUrl = await strategy();
      if (imageUrl && isValidImageUrl(imageUrl)) {
        return makeAbsoluteUrl(imageUrl);
      }
    } catch (e) {
      console.warn(`Image strategy ${strategy.name} failed:`, e);
    }
  }

  // Final fallback to extension icon
  return chrome.runtime.getURL('icons/icon128.png');
}

// ======================
// STRATEGY IMPLEMENTATIONS
// ======================

async function getStructuredDataImage() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = Array.isArray(JSON.parse(script.textContent)) 
        ? JSON.parse(script.textContent) 
        : [JSON.parse(script.textContent)];
      
      for (const item of data) {
        if (item['@type'] === 'Product' || item['@type'] === 'Offer') {
          if (item.image) {
            if (typeof item.image === 'string') return item.image;
            if (Array.isArray(item.image) && item.image.length > 0) return item.image[0];
          }
          if (item.offers?.image) {
            if (typeof item.offers.image === 'string') return item.offers.image;
            if (Array.isArray(item.offers.image) && item.offers.image.length > 0) {
              return item.offers.image[0];
            }
          }
        }
      }
    } catch (e) {
      console.warn('Structured data parse error:', e);
    }
  }
  return null;
}

async function getAmazonImage() {
  if (!window.location.hostname.includes('amazon')) return null;
  
  // Main image
  const mainImage = document.querySelector('#landingImage, #imgBlkFront, #main-image');
  if (mainImage && isValidImageUrl(mainImage.src)) {
    return mainImage.src;
  }
  
  // Zoom image (often higher quality)
  const zoomImage = document.querySelector('[data-action="main-image-click"] img');
  if (zoomImage && isValidImageUrl(zoomImage.src)) {
    return zoomImage.src;
  }
  
  // JavaScript data
  const script = document.querySelector('script:contains("ImageBlockATF")');
  if (script) {
    const match = script.textContent.match(/"mainUrl":"([^"]+)"/);
    if (match && match[1]) {
      const url = match[1].replace(/\\\//g, '/');
      if (isValidImageUrl(url)) return url;
    }
  }
  
  return null;
}

async function getTargetImage() {
  if (!window.location.hostname.includes('target')) return null;
  
  const image = document.querySelector('[data-test="product-image"] img, [data-test="gallery-image"] img');
  return image?.src || null;
}

async function getWalmartImage() {
  if (!window.location.hostname.includes('walmart')) return null;
  
  const image = document.querySelector('.hover-zoom-hero-image, .prod-hero-image img');
  return image?.src || null;
}

async function getBestBuyImage() {
  if (!window.location.hostname.includes('bestbuy')) return null;
  
  const image = document.querySelector('.primary-image img, .product-gallery-image');
  return image?.src || null;
}

async function getEtsyImage() {
  if (!window.location.hostname.includes('etsy')) return null;
  
  const image = document.querySelector('.image-carousel-container img, .carousel-image');
  return image?.src || null;
}

async function getEbayImage() {
  if (!window.location.hostname.includes('ebay')) return null;
  
  const image = document.querySelector('#icImg, #mainImgHldr img');
  return image?.src || null;
}

async function getMetaTagImages() {
  const properties = [
    'meta[property="og:image:secure_url"]',
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'link[rel="image_src"]'
  ];
  
  for (const selector of properties) {
    const tag = document.querySelector(selector);
    if (tag) {
      const url = tag.content || tag.href;
      if (isValidImageUrl(url)) return url;
    }
  }
  return null;
}

async function getGalleryImages() {
  const galleryImages = document.querySelectorAll('.product-image img, .product__image img, .gallery-image img');
  for (const img of galleryImages) {
    if (isValidImageUrl(img.src)) return img.src;
  }
  return null;
}

async function getZoomableImages() {
  const zoomImages = document.querySelectorAll('[data-zoom-image], .zoomImg');
  for (const img of zoomImages) {
    const url = img.getAttribute('data-zoom-image') || img.src;
    if (isValidImageUrl(url)) return url;
  }
  return null;
}

async function getLazyLoadedImages() {
  const images = document.querySelectorAll('img, picture source');
  for (const img of images) {
    const url = img.getAttribute('data-src') ||
                img.getAttribute('data-image') ||
                img.getAttribute('data-srcset')?.split(',')[0]?.split(' ')[0] ||
                img.getAttribute('srcset')?.split(',')[0]?.split(' ')[0] ||
                img.src;

    if (isValidImageUrl(url)) return url;
  }
  return null;
}

async function getPictureTagImage() {
  const pictures = document.querySelectorAll('picture');
  for (const picture of pictures) {
    const sources = picture.querySelectorAll('source');
    for (const source of sources) {
      const srcset = source.getAttribute('srcset');
      if (srcset) {
        const url = srcset.split(',')[0]?.split(' ')[0];
        if (isValidImageUrl(url)) return url;
      }
    }
    const img = picture.querySelector('img');
    if (img && isValidImageUrl(img.src)) return img.src;
  }
  return null;
}

async function getLargestVisibleImage() {
  const images = Array.from(document.querySelectorAll('img')).map(img => {
    const rect = img.getBoundingClientRect();
    return {
      src: img.src,
      width: rect.width,
      height: rect.height,
      area: rect.width * rect.height
    };
  }).filter(img => img.area > 5000).sort((a, b) => b.area - a.area);

  for (const img of images) {
    if (isValidImageUrl(img.src)) return img.src;
  }
  return null;
}

async function getFirstLargeImageNearTitle() {
  const title = document.querySelector('h1, [itemprop="name"], .product-title');
  if (!title) return null;
  
  // Check siblings
  let sibling = title.nextElementSibling;
  for (let i = 0; i < 5 && sibling; i++) {
    const img = sibling.querySelector('img');
    if (img && isValidImageUrl(img.src)) return img.src;
    sibling = sibling.nextElementSibling;
  }
  
  // Check parent container
  const container = title.closest('.product, .product-detail, .pdp-container');
  if (container) {
    const img = container.querySelector('img');
    if (img && isValidImageUrl(img.src)) return img.src;
  }
  
  return null;
}

async function getImageFromProductContainer() {
  const containers = document.querySelectorAll('.product, .product-detail, .pdp-container, .item');
  for (const container of containers) {
    const img = container.querySelector('img');
    if (img && isValidImageUrl(img.src)) return img.src;
  }
  return null;
}

// ======================
// HELPER FUNCTIONS
// ======================

function isValidImageUrl(url) {
  if (!url) return false;
  
  // Skip placeholder images
  const placeholderPatterns = [
    'placeholder', 'blank', 'missing', 'noimage', 'none',
    'spacer', 'pixel', 'transparent', 'empty', 'default'
  ];
  
  const lowerUrl = url.toLowerCase();
  if (placeholderPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return false;
  }
  
  // Skip non-product images
  const nonProductPatterns = [
    'logo', 'icon', 'avatar', 'profile', 'user', 'ad', 
    'banner', 'promo', 'marketing', 'sponsor', 'social'
  ];
  
  if (nonProductPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return false;
  }
  
  // Validate URL format
  try {
    const parsed = new URL(url, window.location.href);
    
    if (!parsed.protocol.startsWith('http') && !parsed.protocol.startsWith('data:')) {
      return false;
    }
    
    // Check file extension
    const path = parsed.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!validExtensions.some(ext => path.endsWith(ext))) {
      if (url.startsWith('data:image/')) {
        const contentType = url.split(';')[0];
        return ['data:image/jpeg', 'data:image/png', 'data:image/webp', 'data:image/gif']
          .some(valid => contentType.startsWith(valid));
      }
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

function makeAbsoluteUrl(url) {
  if (!url) return url;
  
  try {
    if (url.startsWith('//')) {
      return window.location.protocol + url;
    }
    if (url.startsWith('/')) {
      return new URL(url, window.location.origin).href;
    }
    if (!url.startsWith('http') && !url.startsWith('data:')) {
      const basePath = window.location.href.split('?')[0];
      const baseUrl = basePath.substring(0, basePath.lastIndexOf('/') + 1);
      return new URL(url, baseUrl).href;
    }
    return url;
  } catch (e) {
    console.warn('URL normalization failed:', e);
    return url;
  }
}

function isValidImageUrl(url) {
  if (!url) return false;
  
  const placeholderKeywords = ['placeholder', 'blank', 'missing', 'noimage', 'none'];
  const lowerUrl = url.toLowerCase();
  if (placeholderKeywords.some(kw => lowerUrl.includes(kw))) {
    return false;
  }
  
  try {
    const parsed = new URL(url, window.location.href);
    
    if (!parsed.protocol.startsWith('http') && !parsed.protocol.startsWith('data:')) {
      return false;
    }
    
    const path = parsed.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    if (!validExtensions.some(ext => path.endsWith(ext))) {
      if (url.startsWith('data:image/')) {
        const contentType = url.split(';')[0];
        return ['data:image/jpeg', 'data:image/png', 'data:image/webp', 'data:image/gif']
          .some(valid => contentType.startsWith(valid));
      }
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

async function getConsensusPrice() {
  // Check site-specific conditions
  const hostname = window.location.hostname;
  const isNordstrom = hostname.includes('nordstrom');
  const isCostco = hostname.includes('costco');
  const isSportChek = hostname.includes('sportchek');
  const isApple = hostname.includes('apple');
  const isEb = hostname.includes('gamestop');
  const isLowes = hostname.includes('lowes');
  const isSears = hostname.includes('sears');
  const isholt = hostname.includes('holtrenfrew');
  const isxbox = hostname.includes('xbox');
  const isnapa = hostname.includes('napacanada');


  const strategies = [
    ...(isNordstrom ? [] : [getStructuredDataPrice]),
    getPriceFromMetaTags,
    getPriceFromHiddenInputs,
    ...((isCostco || isSportChek || isApple || isLowes || isEb || isSears || isholt || isxbox || isnapa) ? [] : [getPriceFromFallbackMethods]),
    ...((isCostco || isnapa) ? [] : [getPriceFromTextSearch])
  ].filter(Boolean);

  // Run all strategies in parallel with timeout
  const results = await Promise.allSettled(
    strategies.map(strategy => 
      Promise.race([
        strategy(),
        new Promise(resolve => setTimeout(resolve, 500, null))
      ])
    )
  );

  // Process results and count occurrences (no early price filtering)
  const priceCounts = {};
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      const normalized = normalizePrice(result.value);
      if (normalized) {
        priceCounts[normalized] = (priceCounts[normalized] || 0) + 1;
      }
    }
  });

  // Get the most common price with at least 2 confirmations
  const sortedPrices = Object.entries(priceCounts)
    .sort((a, b) => b[1] - a[1]);

  let finalPrice = 'N/A';
  
  if (sortedPrices.length > 0 && sortedPrices[0][1] >= 2) {
    finalPrice = sortedPrices[0][0];
  } 
  // Fallback to highest confidence if no consensus
  else if (sortedPrices.length > 0) {
    finalPrice = sortedPrices[0][0];
  }

  // Final gatekeeper: Reject if price > 20,000
  if (finalPrice !== 'N/A') {
    const numericValue = parseFloat(finalPrice.replace(/[^\d.]/g, ''));
    if (isNaN(numericValue)) {
      return 'N/A';
    }
    return numericValue <= 20000 ? finalPrice : 'N/A';
  }

  return finalPrice;
}
