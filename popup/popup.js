document.addEventListener('DOMContentLoaded', () => {
  const historyList = document.getElementById('history-list');
  const optionsButton = document.getElementById('options-button');

  // Load history
  loadHistory();

  // Options button
  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Listen for history updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.history) {
      loadHistory();
    }
  });
});

function loadHistory() {
  chrome.storage.sync.get(['history'], (result) => {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    if (!result.history || result.history.length === 0) {
      historyList.innerHTML = '<div class="empty">No history yet</div>';
      return;
    }

    result.history.slice(0, 5).forEach((item) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.dataset.id = item.id;
      
      const header = document.createElement('div');
      header.className = 'history-item-header';
      
      const title = document.createElement('div');
      title.className = 'history-item-title';
      title.textContent = new Date(item.timestamp).toLocaleString();
      
      const lengthTag = document.createElement('span');
      lengthTag.className = 'history-item-length';
      lengthTag.textContent = item.length;
      // ... (keep your existing style setup)
      
      const summary = document.createElement('div');
      summary.className = 'history-item-summary';
      summary.title = "Click to expand/collapse";
      
      if (item.summary.length > 100) {
        summary.innerHTML = `
          <span class="summary-preview">${item.summary.substring(0, 100)}...</span>
          <span class="summary-full" style="display:none">${item.summary}</span>
        `;
      } else {
        summary.textContent = item.summary;
      }
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.className = 'history-delete-btn';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryItem(item.id);
      });
      
      header.appendChild(title);
      header.appendChild(lengthTag);
      header.appendChild(deleteBtn);
      
      historyItem.appendChild(header);
      historyItem.appendChild(summary);
      
      // Click handler for expand/collapse
      historyItem.addEventListener('click', function(e) {
        if (e.target.classList.contains('history-delete-btn')) return;
        
        const fullText = this.querySelector('.summary-full');
        const previewText = this.querySelector('.summary-preview');
        
        if (fullText) {
          if (fullText.style.display === 'none') {
            fullText.style.display = 'inline';
            previewText.style.display = 'none';
          } else {
            fullText.style.display = 'none';
            previewText.style.display = 'inline';
          }
        }
      });
      
      historyList.appendChild(historyItem);
    });
  });
}

async function deleteHistoryItem(id) {
  const { history = [] } = await chrome.storage.sync.get(['history']);
  const updatedHistory = history.filter(item => item.id !== id);
  await chrome.storage.sync.set({ history: updatedHistory });
}
