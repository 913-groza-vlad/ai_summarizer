chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarize-selection",
    title: "Summarize selection",
    contexts: ["selection"]
  });

  chrome.storage.sync.set({
    cohereKey: "",
    summaryLength: "medium",
    history: []
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "summarize-selection" && info.selectionText) {
    const { summaryLength } = await chrome.storage.sync.get(['summaryLength']);
    
    chrome.tabs.sendMessage(tab.id, {
      action: "summarize",
      text: info.selectionText,
      length: summaryLength || 'medium'
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not injected yet, so do it
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).then(() => {
          // Now retry the message
          chrome.tabs.sendMessage(tab.id, {
            action: "summarize",
            text: info.selectionText,
            length: summaryLength || 'medium'
          });
        });
      }
    });
  }
});

// Handle API requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callCohere") {
    callCohereAPI(request.text, request.options)
      .then(summary => sendResponse({ success: true, summary }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message port open
  }

  if (request.action === 'saveToHistory') {
    saveToHistory(request.text, request.summary, request.length)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

// Cohere API function
async function callCohereAPI(text, options) {
  const { cohereKey } = await chrome.storage.sync.get(['cohereKey']);
  if (!cohereKey) throw new Error("Cohere API key not set");

  const lengthMap = {
    short: "short",
    medium: "medium",
    long: "long"
  };

  const response = await fetch("https://api.cohere.ai/v1/summarize", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${cohereKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      text: text,
      length: lengthMap[options.length] || "medium",
      format: "paragraph",
      model: "command",
      temperature: 0.3,
      additional_command: "Summarize the selected content in English regardless of original language of the text."
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Cohere API error");
  }

  const data = await response.json();
  return data.summary;
}

async function saveToHistory(text, summary, length) {
  const { history = [] } = await chrome.storage.sync.get(['history']);
  
  // Create new history item with timestamp
  const newItem = {
    id: Date.now(),
    text,
    summary,
    length,
    timestamp: new Date().toISOString()
  };
  
  // Add to beginning of array (newest first) and limit to 50 items
  const updatedHistory = [newItem, ...history].slice(0, 50);
  
  await chrome.storage.sync.set({ history: updatedHistory });
}