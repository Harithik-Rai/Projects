// Connection manager
let isAlive = true;
const connectionInterval = setInterval(verifyConnection, 30000);

// Verify connection periodically
function verifyConnection() {
  chrome.runtime.sendMessage({type: "ping"}, (response) => {
    if (chrome.runtime.lastError || !response) {
      isAlive = false;
      clearInterval(connectionInterval);
    }
  });
}

// Initialize connection
chrome.runtime.sendMessage({type: "contentScriptReady"}, (response) => {
  if (chrome.runtime.lastError) {
    console.log("Initial connection failed, will retry...");
    setTimeout(() => chrome.runtime.sendMessage({type: "contentScriptReady"}), 1000);
  }
});

// Cleanup on tab close
window.addEventListener('unload', () => {
  clearInterval(connectionInterval);
});

// Message handler
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

// Enhanced price scraping function with consistent currency formatting
async function scrapeItemInfo(url) {
  try {
    const titleEl = document.querySelector('h1, [itemprop="name"], .product-title') || 
                   document.querySelector('title');
    let title = titleEl?.textContent?.trim() || 
               document.querySelector('meta[property="og:title"]')?.content || 
               'Product from ' + new URL(url).hostname;
    title = title.replace(/\s+/g, ' ').substring(0, 100);

    let price = await findUniversalPrice() || 'N/A';
    
    // Ensure price has currency symbol if it's a valid number
    if (price !== 'N/A' && !price.toString().match(/^(\$|£|€|¥|CAD|USD)/)) {
      price = `$${price}`;
    }

    const image = document.querySelector('[itemprop="image"]')?.src || 
                 document.querySelector('meta[property="og:image"]')?.content || 
                 document.querySelector('.product-image img')?.src || 
                 chrome.runtime.getURL('icons/icon128.png');

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

// Universal price detection with improved currency handling
async function findUniversalPrice() {
  const strategies = [
    () => findStructuredPrice(),
    () => findPriceBySelectors([
      '.sale-price', '.price--sale', '.product-price--sale',
      '[itemprop="price"]', 
      '.price', '.product-price',
      '.price__amount', '.price-value', '.current-price',
      '.price-final', '.final-price'
    ]),
    () => findPriceInContainerWithSaleIndicator(),
    () => findPriceByAttributes([
      'data-price', 'data-product-price', 'data-amount', 'content'
    ]),
    () => {
      const meta = document.querySelector('meta[property="product:price:amount"]');
      return meta?.content ? formatPrice(meta.content) : null;
    },
    () => findPriceInDocument()
  ];

  for (const strategy of strategies) {
    try {
      const price = await strategy();
      if (price) return ensureCurrencySymbol(price);
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.warn('Price strategy failed:', e);
    }
  }
  return null;
}

// Helper function to ensure price has currency symbol
function ensureCurrencySymbol(price) {
  if (typeof price === 'string' && price.match(/^\d/)) {
    return `$${price}`;
  }
  return price;
}

// Enhanced structured price detection
async function findStructuredPrice() {
  try {
    const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scriptTags) {
      try {
        const data = JSON.parse(script.textContent);
        if (data instanceof Array) {
          for (const item of data) {
            if (item.offers?.price || item.price) {
              return formatPrice(item.offers?.price || item.price);
            }
          }
        } else if (data.offers?.price || data.price) {
          return formatPrice(data.offers?.price || data.price);
        }
      } catch (e) {
        console.warn('Failed to parse JSON-LD', e);
      }
    }
    
    const priceEl = document.querySelector('[itemtype="http://schema.org/Product"] [itemprop="price"]');
    if (priceEl) {
      const price = extractPriceFromText(priceEl.textContent) || priceEl.getAttribute('content');
      if (price) return formatPrice(price);
    }
    
    return null;
  } catch (e) {
    console.warn('Structured price search failed', e);
    return null;
  }
}

// Improved price container search
async function findPriceInContainerWithSaleIndicator() {
  const containers = [
    '.product-price-info', '.price-box', '.product-details',
    '.product-info-main', '.product__price', '.product-pricing'
  ];
  
  for (const selector of containers) {
    const container = document.querySelector(selector);
    if (container) {
      const salePriceEl = container.querySelector('.sale-price, .price--on-sale, .product-price--sale');
      if (salePriceEl) {
        const price = extractPriceFromText(salePriceEl.textContent);
        if (price) return price;
      }
      
      const allPrices = container.querySelectorAll('[class*="price"], [class*="Price"]');
      let bestPrice = null;
      
      for (const priceEl of allPrices) {
        const price = extractPriceFromText(priceEl.textContent);
        if (price) {
          const style = window.getComputedStyle(priceEl);
          if (style.textDecoration.includes('line-through')) {
            if (!bestPrice) bestPrice = price;
          } else {
            return price;
          }
        }
      }
      
      if (bestPrice) return bestPrice;
      
      const price = extractPriceFromText(container.textContent);
      if (price) return price;
    }
  }
  return null;
}

// Enhanced price extraction
function extractPriceFromText(text) {
  if (!text) return null;
  
  // Match currency symbol followed by numbers
  const currencyMatch = text.match(/(\$|£|€|¥|CAD|USD)\s*([\d,]+\.?\d{0,2})/);
  if (currencyMatch) {
    return `${currencyMatch[1]}${currencyMatch[2].replace(/,/g, '')}`;
  }
  
  // Match numbers that look like prices
  const numberMatch = text.match(/(\d[\d,]*\.?\d{0,2})/);
  if (numberMatch) {
    return `$${numberMatch[0].replace(/,/g, '')}`;
  }
  
  return null;
}

// Robust price formatting
function formatPrice(price) {
  if (!price) return null;
  
  if (typeof price === 'number') {
    return `$${price.toFixed(2)}`;
  }
  
  // If already has currency symbol, return as-is
  if (price.toString().match(/^(\$|£|€|¥|CAD|USD)/)) {
    return price.toString()
      .replace(/\s+/g, '')
      .replace(/,(\d{3})/, '$1')
      .replace(/,(\d{2})$/, '.$1');
  }
  
  // Otherwise add dollar sign
  const numericValue = price.toString()
    .replace(/\s+/g, '')
    .replace(/,(\d{3})/, '$1')
    .replace(/,(\d{2})$/, '.$1')
    .replace(/[^\d.]/g, '')
    .replace(/^[^\d]*(\d+\.?\d*).*$/, '$1');
    
  return `$${numericValue}`;
}

// Helper functions for price detection
async function findPriceBySelectors(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const price = extractPriceFromText(el.textContent);
      if (price) return price;
    }
  }
  return null;
}

async function findPriceByAttributes(attrs) {
  for (const attr of attrs) {
    const el = document.querySelector(`[${attr}]`);
    if (el) {
      const price = extractPriceFromText(el.getAttribute(attr));
      if (price) return price;
    }
  }
  return null;
}

async function findPriceInDocument() {
  // Look for the most prominent price in the document
  const priceElements = document.querySelectorAll('body [class*="price"], body [class*="Price"]');
  for (const el of priceElements) {
    const price = extractPriceFromText(el.textContent);
    if (price) return price;
  }
  
  // Fallback to text search
  const pricePattern = /(\$|£|€|¥|CAD|USD)\s*[\d,]+\.?\d{0,2}/;
  const matches = document.body.textContent.match(pricePattern);
  return matches ? formatPrice(matches[0]) : null;
}