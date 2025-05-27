document.addEventListener('DOMContentLoaded', function() {
  const itemUrlInput = document.getElementById('item-url');
  const addItemBtn = document.getElementById('add-item-btn');
  const cartItemsContainer = document.getElementById('cart-items');
  const clearCartBtn = document.getElementById('clear-cart');
  const subtotalElement = document.getElementById('cart-subtotal');
  const refreshBtn = document.getElementById('refresh-connection');
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  
  // Enhanced connection state tracking
  const connectionState = {
    isConnected: false,
    lastError: null,
    retryCount: 0,
    lastChecked: 0
  };
  
  // Initialize
  loadCartItems();
  checkConnection();
  
  // Event listeners
  addItemBtn.addEventListener('click', addItemFromUrl);
  itemUrlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addItemFromUrl();
  });
  clearCartBtn.addEventListener('click', clearCart);
  refreshBtn.addEventListener('click', refreshConnection);

  // Price calculation helpers
  function parsePrice(priceStr) {
    if (!priceStr || priceStr === 'N/A') return 0;
    const normalized = priceStr
      .replace(/[^\d.,]/g, '')
      .replace(/(\d)[.,](\d{3})/g, '$1$2')
      .replace(',', '.');
    return parseFloat(normalized) || 0;
  }

  function calculateSubtotal(items) {
    return items.reduce((sum, item) => sum + parsePrice(item.price), 0)
                .toFixed(2);
  }

  function updateSubtotal(items) {
    subtotalElement.textContent = '$' + calculateSubtotal(items);
  }

  // Enhanced connection checking
async function checkConnection() {
  try {
    const now = Date.now();
    if (now - connectionState.lastChecked < 1000 && connectionState.lastError) {
      return connectionState.isConnected;
    }
    connectionState.lastChecked = now;

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length) {
      throw new Error('No active tab found');
    }

    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "ping" },
        (response) => {
          if (chrome.runtime.lastError) {
            // Replace Chrome's error with a custom message
            connectionState.lastError = "Disconnected, please use a site that we can connect with.";
            resolve(false);
          } else {
            connectionState.lastError = null;
            resolve(!!response);
          }
        }
      );
    });

    connectionState.isConnected = response;
    updateConnectionStatus();
    return response;
  } catch (error) {
    console.error("Connection check failed:", error);
    connectionState.isConnected = false;
    connectionState.lastError = "Disconnected, please use a supported site.";
    updateConnectionStatus();
    return false;
  }
}

function updateConnectionStatus() {
  statusDot.classList.toggle('disconnected', !connectionState.isConnected);
  
  if (connectionState.isConnected) {
    statusText.textContent = 'Connected';
    refreshBtn.style.display = 'none';
  } else {
    // Always show the custom message instead of the raw error
    statusText.textContent = "Disconnected, please use a supported site.";
    refreshBtn.style.display = 'block';
  }
}

  // Robust connection refresh
  async function refreshConnection() {
    refreshBtn.disabled = true;
    statusText.textContent = 'Connecting...';
    connectionState.retryCount++;
    
    try {
      // First try simple reconnect
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (!tabs.length) {
        throw new Error("No active tab");
      }

      // Inject fresh content script
      await chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        files: ['content.js'],
        injectImmediately: true
      });

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify connection
      const success = await checkConnection();
      if (!success) {
        throw new Error("Still not connected after refresh");
      }
    } catch (error) {
      console.error("Refresh failed:", error);
      connectionState.isConnected = false;
      connectionState.lastError = error.message;
      updateConnectionStatus();
      
      // Auto-retry up to 3 times
      if (connectionState.retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshConnection();
        return;
      }
      
      alert("Could not establish connection. Please reload the page.");
    } finally {
      refreshBtn.disabled = false;
      connectionState.retryCount = 0;
    }
  }

  // Enhanced item adding with connection handling
  async function addItemFromUrl() {
    const url = itemUrlInput.value.trim();
    if (!url) return;

    try {
      new URL(url);
    } catch (e) {
      alert('Please enter a valid URL');
      return;
    }

    // Verify connection
    if (!await checkConnection()) {
      const shouldRefresh = confirm("Connection lost. Refresh connection?");
      if (shouldRefresh) await refreshConnection();
      if (!connectionState.isConnected) return;
    }

    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (!tabs.length || !tabs[0].id) {
        throw new Error("No active tab found");
      }

      // Add timeout to prevent hanging
      const response = await Promise.race([
        new Promise((resolve) => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {action: "scrapeItem", url: url},
            (response) => {
              if (chrome.runtime.lastError) {
                connectionState.isConnected = false;
                connectionState.lastError = chrome.runtime.lastError.message;
                updateConnectionStatus();
                resolve({success: false, error: chrome.runtime.lastError.message});
              } else {
                resolve(response || {success: false, error: "No response"});
              }
            }
          );
        }),
        new Promise((resolve) => setTimeout(
          () => resolve({success: false, error: "Timeout after 5 seconds"}),
          5000
        ))
      ]);

      if (response?.success) {
        addItemToCart(response.item);
        itemUrlInput.value = '';
      } else {
        throw new Error(response?.error || "Failed to scrape item");
      }
    } catch (error) {
      console.error("Add item error:", error.message);
      connectionState.isConnected = false;
      connectionState.lastError = error.message;
      updateConnectionStatus();
      addFallbackItem(url, error.message);
    }
  }

  function addFallbackItem(url, error = '') {
    console.warn(`Using fallback item due to: ${error}`);
    addItemToCart({
      title: 'Item from ' + new URL(url).hostname,
      url: url,
      image: chrome.runtime.getURL('icons/icon128.png'),
      price: 'N/A'
    });
  }

  function addItemToCart(item) {
    chrome.storage.local.get(['cartItems'], function(result) {
      const cartItems = result.cartItems || [];
      if (!cartItems.some(i => i.url === item.url)) {
        cartItems.push(item);
        chrome.storage.local.set({cartItems: cartItems}, function() {
          renderCartItems(cartItems);
          updateSubtotal(cartItems);
        });
      }
    });
  }

  function loadCartItems() {
    chrome.storage.local.get(['cartItems'], function(result) {
      const cartItems = result.cartItems || [];
      renderCartItems(cartItems);
      updateSubtotal(cartItems);
    });
  }

  function renderCartItems(items) {
    cartItemsContainer.innerHTML = items.length ? '' : '<p class="empty-cart">Your cart is empty</p>';
    
    items.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.title}" 
             onerror="this.src='${chrome.runtime.getURL('icons/icon128.png')}'">
        <div class="item-info">
          <div class="item-title">${item.title}</div>
          <div class="item-price">${item.price}</div>
          <a class="item-link" href="${item.url}" target="_blank" rel="noopener noreferrer">View Product</a>
          <button class="remove-item" data-index="${index}">Remove Item</button>
        </div>
      `;
      cartItemsContainer.appendChild(itemEl);
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => removeItemFromCart(parseInt(btn.dataset.index)));
    });
  }

  function removeItemFromCart(index) {
    chrome.storage.local.get(['cartItems'], function(result) {
      const cartItems = result.cartItems || [];
      cartItems.splice(index, 1);
      chrome.storage.local.set({cartItems: cartItems}, function() {
        renderCartItems(cartItems);
        updateSubtotal(cartItems);
      });
    });
  }

  function clearCart() {
    if (confirm('Clear all items from cart?')) {
      chrome.storage.local.set({cartItems: []}, function() {
        renderCartItems([]);
        updateSubtotal([]);
      });
    }
  }
});