const activeConnections = new Set();

// Connection tracking
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "universal-cart") {
    const tabId = port.sender?.tab?.id;
    if (tabId) {
      activeConnections.add(tabId);
      port.onDisconnect.addListener(() => {
        activeConnections.delete(tabId);
      });
    }
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Content script ready signal
  if (message.type === "contentScriptReady") {
    if (sender.tab?.id) activeConnections.add(sender.tab.id);
    sendResponse({status: "ready"});
    return;
  }
  
  // Ping/pong for connection testing
  if (message.type === "ping") {
    sendResponse({type: "pong", status: "healthy"});
    return;
  }
  
  // Forward scrape requests
  if (sender.tab && message.action === "scrapeItem") {
    if (!activeConnections.has(sender.tab.id)) {
      sendResponse({
        success: false, 
        error: "Disconnected, please use a supported site.",
        suggestion: "Try refreshing the page"
      });
      return;
    }
    
    chrome.tabs.sendMessage(sender.tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Message forwarding error:", chrome.runtime.lastError);
        sendResponse({
          success: false, 
          error: "Disconnected, please use a supported site.",
          code: "CONNECTION_FAILED"
        });
      } else {
        sendResponse(response || {
          success: false,
          error: "Empty response from content script"
        });
      }
    });
    return true; // Required for async sendResponse
  }
});

// Clean up dead connections
setInterval(() => {
  chrome.tabs.query({}, (tabs) => {
    const activeTabIds = new Set(tabs.map(tab => tab.id));
    activeConnections.forEach(tabId => {
      if (!activeTabIds.has(tabId)) {
        activeConnections.delete(tabId);
      }
    });
  });
}, 30000);
