// console.log("AI Summarizer content script loaded");

// // Handle connection from popup
// chrome.runtime.onConnect.addListener((port) => {
//   console.log("Connected to popup");
// });

// // Handle messages from background or popup
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "summarize") {
//     showSummaryUI(request.text);
//   }
// });

// function showSummaryUI(text) {
//   // Remove existing summary UI if present
//   const existingUI = document.getElementById('ai-summarizer-container');
//   if (existingUI) existingUI.remove();

//   // Create container
//   const container = document.createElement('div');
//   container.id = 'ai-summarizer-container';
//   container.className = 'ai-summarizer';

//   // Create header
//   const header = document.createElement('div');
//   header.className = 'ai-summarizer-header';
//   header.innerHTML = `
//     <h3>AI Summary</h3>
//     <button class="close-button">&times;</button>
//   `;

//   // Create content area
//   const content = document.createElement('div');
//   content.className = 'ai-summarizer-content';
//   content.textContent = 'Generating summary...';

//   // Create footer with options
//   const footer = document.createElement('div');
//   footer.className = 'ai-summarizer-footer';
//   footer.innerHTML = `
//     <select class="length-selector">
//       <option value="short">Short</option>
//       <option value="medium" selected>Medium</option>
//       <option value="long">Long</option>
//     </select>
//     <button class="copy-button">Copy</button>
//     <button class="save-button">Save</button>
//   `;

//   container.appendChild(header);
//   container.appendChild(content);
//   container.appendChild(footer);
//   document.body.appendChild(container);

//   // Position near selection
//   const selection = window.getSelection();
//   if (selection.rangeCount > 0) {
//     const range = selection.getRangeAt(0);
//     const rect = range.getBoundingClientRect();
//     container.style.position = 'absolute';
//     container.style.top = `${rect.bottom + window.scrollY + 10}px`;
//     container.style.left = `${rect.left + window.scrollX}px`;
//   }

//   // Generate summary
//   generateSummary(text, 'medium').then(summary => {
//     content.textContent = summary;
//   });

//   // Add event listeners
//   header.querySelector('.close-button').addEventListener('click', () => {
//     container.remove();
//   });

//   footer.querySelector('.length-selector').addEventListener('change', (e) => {
//     content.textContent = 'Generating new summary...';
//     generateSummary(text, e.target.value).then(summary => {
//       content.textContent = summary;
//     });
//   });

//   footer.querySelector('.copy-button').addEventListener('click', () => {
//     navigator.clipboard.writeText(content.textContent);
//   });

//   footer.querySelector('.save-button').addEventListener('click', () => {
//     chrome.runtime.sendMessage({
//       action: 'saveToHistory',
//       text,
//       summary: content.textContent,
//       length: footer.querySelector('.length-selector').value
//     });
//   });
// }

// async function generateSummary(text, length) {
//   try {
//     const response = await chrome.runtime.sendMessage({
//       action: 'callAI',
//       text,
//       options: { length, multilingual: true }
//     });
    
//     if (response.success) {
//       // Parse the response to show language detection
//       const summary = await callClaudeInstant(text, options);
      
//       // if (langMatch) {
//       //   return `Original Language: ${langMatch[1]}\n\n${pureSummary}`;
//       // }
//       return summary;
//     }
//     throw new Error(response.error || "Unknown error");
//   } catch (error) {
//     console.error("Summary error:", error);
//     return `Error: ${error.message}`;
//   }
// }

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "summarize") {
    // Get the stored length setting
    const { summaryLength } = await chrome.storage.sync.get(['summaryLength']);
    generateSummary(request.text, summaryLength || 'medium').then(summary => {
      showSummaryUI(summary, request.text, summaryLength || 'medium');
    });
  }
});

async function generateSummary(text, length) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "callCohere",
      text: text,
      options: { length }
    });

    if (response.success) {
      return response.summary;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    return `⚠️ Error: ${error.message}`;
  }
}

function showSummaryUI(summary, text, initialLength) {
  const existingUI = document.getElementById('ai-summarizer-container');
  if (existingUI) existingUI.remove();

  const container = document.createElement('div');
  container.id = 'ai-summarizer-container';
  container.className = 'ai-summarizer';
  
  // Store whether we're showing an error
  const isError = summary.startsWith('⚠️ Error:') || summary.includes('error-icon');
  
  // Set the selected option based on stored length
  container.innerHTML = `
    <div class="ai-summarizer-header">
      <h3>Summary</h3>
      <button class="close-button">&times;</button>
    </div>
    <div class="ai-summarizer-content">${summary}</div>
    <div class="ai-summarizer-footer">
      <select class="length-selector">
        <option value="short" ${initialLength === 'short' ? 'selected' : ''}>Short</option>
        <option value="medium" ${initialLength === 'medium' ? 'selected' : ''}>Medium</option>
        <option value="long" ${initialLength === 'long' ? 'selected' : ''}>Long</option>
      </select>
      <button class="copy-button" ${isError ? 'disabled' : ''} style="color: #333333;">Copy</button>
      <button class="save-button" ${isError ? 'disabled' : ''} style="color: #333333;">Save</button>
    </div>
  `;

  document.body.appendChild(container);

  // Get button references
  const copyBtn = container.querySelector('.copy-button');
  const saveBtn = container.querySelector('.save-button');
  const contentDiv = container.querySelector('.ai-summarizer-content');

  // Event delegation for all buttons
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-button')) {
      container.remove();
    }
    else if (e.target.classList.contains('copy-button') && !copyBtn.disabled) {
      navigator.clipboard.writeText(contentDiv.textContent);
    }
    else if (e.target.classList.contains('save-button') && !saveBtn.disabled) {
      const length = container.querySelector('.length-selector').value;
      
      // Add visual feedback
      e.target.textContent = 'Saving...';
      e.target.disabled = true;
      
      chrome.runtime.sendMessage({
        action: 'saveToHistory',
        text: text,
        summary: contentDiv.textContent,
        length
      }, (response) => {
        // Restore button state
        e.target.textContent = 'Save';
        e.target.disabled = isError; // Re-disable if error
        
        if (response?.success) {
          const confirmation = document.createElement('div');
          confirmation.textContent = '✓ Saved to history';
          confirmation.style.color = '#4CAF50';
          confirmation.style.marginTop = '5px';
          confirmation.style.fontSize = '12px';
          
          e.target.insertAdjacentElement('afterend', confirmation);
          setTimeout(() => confirmation.remove(), 2000);
        }
      });
    }
  });

  // Handle length changes
  container.querySelector('.length-selector').addEventListener('change', (e) => {
    contentDiv.textContent = 'Generating new summary...';
    copyBtn.disabled = true;
    saveBtn.disabled = true;
    
    generateSummary(text, e.target.value)
      .then(newSummary => {
        contentDiv.textContent = newSummary;
        copyBtn.disabled = false;
        saveBtn.disabled = false;
      })
      .catch(error => {
        contentDiv.innerHTML = `
          <div class="error-icon">⚠️</div>
          <div class="error-message">${error.message}</div>
        `;
        copyBtn.disabled = true;
        saveBtn.disabled = true;
      });
  });

  // Initial generation if needed
  if (summary === 'Generating summary...') {
    generateSummary(text, initialLength)
      .then(newSummary => {
        contentDiv.textContent = newSummary;
        copyBtn.disabled = false;
        saveBtn.disabled = false;
      })
      .catch(error => {
        contentDiv.innerHTML = `
          <div class="error-icon">⚠️</div>
          <div class="error-message">${error.message}</div>
        `;
        copyBtn.disabled = true;
        saveBtn.disabled = true;
      });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateLengthSetting") {
    const container = document.getElementById('ai-summarizer-container');
    if (container) {
      const selector = container.querySelector('.length-selector');
      if (selector) {
        selector.value = request.length;
      }
    }
  }
});