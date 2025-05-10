// // Handle extension installation
// chrome.runtime.onInstalled.addListener(() => {
//   // Create context menu item
//   chrome.contextMenus.create({
//     id: "summarize-selection",
//     title: "Summarize selection",
//     contexts: ["selection"]
//   });

//   // Set default settings
//   chrome.storage.sync.set({
//     apiKey: "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",
//     provider: "openai",
//     model: "gpt-3.5-turbo",
//     summaryLength: "medium",
//     temperature: 0.7,
//     history: []
//   });
// });

// async function sendMessageToTab(tabId, message) {
//   try {
//     // First try direct message
//     return await chrome.tabs.sendMessage(tabId, message);
//   } catch (error) {
//     // If failed, inject script and try again
//     await chrome.scripting.executeScript({
//       target: { tabId },
//       files: ['content.js']
//     });
//     return await chrome.tabs.sendMessage(tabId, message);
//   }
// }


// // Handle context menu clicks
// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
//   if (info.menuItemId === "summarize-selection" && info.selectionText) {
//     await sendMessageToTab(tab.id, {
//       action: "summarize",
//       text: info.selectionText
//     });
//   }
// });

// // Handle API requests
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "callAI") {
//     callAIProvider(request.text, request.options)
//       .then(summary => sendResponse({ success: true, summary }))
//       .catch(error => sendResponse({ success: false, error: error.message }));
//     return true; // Required for async response
//   }
// });

// const rateLimit = {
//   lastCall: 0,
//   minInterval: 3000 // 3 seconds between calls
// };

// async function callAIProvider(text, options) {
//   const now = Date.now();
//   if (now - rateLimit.lastCall < rateLimit.minInterval) {
//     throw new Error(`Please wait ${(rateLimit.minInterval - (now - rateLimit.lastCall))/1000} seconds before summarizing again`);
//   }
  
//   rateLimit.lastCall = now;

//   const { apiKey, provider, model, temperature } = await chrome.storage.sync.get([
//     "apiKey", "provider", "model", "temperature"
//   ]);

//   if (!apiKey) throw new Error("API key not set");

//   const prompt = createMultilingualPrompt(text, options.length);
  
//   if (provider === "openai") {
//     return callOpenAI(apiKey, model, prompt, temperature);
    
//   }
//   if (provider === "claude") {
//     return callClaudeInstant(text, options);
//   }
// }

// function createMultilingualPrompt(text, length) {
//   const lengthInstructions = {
//     short: "Provide a very concise summary in 1-2 sentences.",
//     medium: "Provide a summary in about 3-5 sentences.",
//     long: "Provide a detailed summary in about 6-8 sentences."
//   };
  
//   return `
//     Summarize the following text in English, regardless of its original language.
//     First detect the language, then provide an English summary.
    
//     ${lengthInstructions[length] || lengthInstructions.medium}
//     Focus on the key points and main ideas.
    
//     Text: "${text}"
    
//     Detected Language: [auto-detect]
//     English Summary:
//   `;
// }

// async function callClaudeInstant(text, options) {
//   const prompt = createClaudePrompt(text, options.length);
  
//   try {
//     // First get the Poe.com cookie (requires user to be logged in)
//     const cookies = await chrome.cookies.get({
//       url: "https://poe.com",
//       name: "p-b"
//     });

//     if (!cookies) {
//       throw new Error("Please login to Poe.com first in your browser");
//     }

//     const response = await fetch("https://poe.com/api/free/claude_instant", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Accept": "application/json",
//         "Cookie": `p-b=${cookies.value}`
//       },
//       body: JSON.stringify({
//         message: prompt,
//         temperature: 0.7
//       })
//     });
    
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `API request failed with status ${response.status}`);
//     }
    
//     const data = await response.json();
//     return data.response || data.message || data.text || "No summary generated";
//   } catch (error) {
//     console.error("Claude API error:", error);
//     throw new Error(`Failed to call Claude: ${error.message}`);
//   }
// }

// function createClaudePrompt(text, length) {
//   const lengthMap = {
//     short: "Provide a very concise summary in 1-2 sentences.",
//     medium: "Provide a summary in 3-5 sentences.",
//     long: "Provide a detailed summary in 6-8 sentences."
//   };
  
//   return `
//     Summarize the following text in English, regardless of its original language.
//     ${lengthMap[length] || lengthMap.medium}
//     Focus on key points and main ideas.
    
//     Text: "${text}"
    
//     Summary:
//   `;
// }

// async function callOpenAI(apiKey, model, prompt, temperature) {
//   const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${apiKey}`
//     },
//     body: JSON.stringify({
//       model,
//       messages: [{ role: "user", content: prompt }],
//       temperature
//     })
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.error?.message || "Failed to call OpenAI API");
//   }

//   const data = await response.json();
//   return data.choices[0].message.content.trim();
// }

// function createPrompt(text, length) {
//   const lengthInstructions = {
//     short: "Provide a very concise summary in 1-2 sentences.",
//     medium: "Provide a summary in about 3-5 sentences.",
//     long: "Provide a detailed summary in about 6-8 sentences."
//   };
  
//   return `
//     Please summarize the following text. 
//     ${lengthInstructions[length] || lengthInstructions.medium}
//     Focus on the key points and main ideas.
    
//     Text: "${text}"
    
//     Summary:
//   `;
// }

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
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(tab.id, {
        action: "summarize",
        text: info.selectionText,
        length: summaryLength || 'medium'
      });
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