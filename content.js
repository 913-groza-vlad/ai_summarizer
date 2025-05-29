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
      <select class="length-selector" style="width: 150px; margin-right: 20px;">
        <option value="short" ${initialLength === 'short' ? 'selected' : ''}>Short</option>
        <option value="medium" ${initialLength === 'medium' ? 'selected' : ''}>Medium</option>
        <option value="long" ${initialLength === 'long' ? 'selected' : ''}>Long</option>
      </select>
      <button class="copy-button" ${isError ? 'disabled' : ''} style="color: #333333;">Copy</button>
      <button class="save-button" ${isError ? 'disabled' : ''} style="color: #333333;">Save</button>
    </div>
  `;

  document.body.appendChild(container);

  const header = container.querySelector('.ai-summarizer-header');
  let isDragging = false;
  let offsetX, offsetY;

  // Mouse down event to start dragging
  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('close-button')) return;
    
    isDragging = true;
    offsetX = e.clientX - container.getBoundingClientRect().left;
    offsetY = e.clientY - container.getBoundingClientRect().top;
    
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
  });

  // Mouse move event for dragging
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    container.style.position = 'fixed';
    container.style.left = `${e.clientX - offsetX}px`;
    container.style.top = `${e.clientY - offsetY}px`;
  });

  // Mouse up to stop dragging
  document.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = '';
    container.style.userSelect = '';
  });

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
  if (summary === 'Generating new summary...') {
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