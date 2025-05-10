document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['cohereKey', 'summaryLength'], (data) => {
    document.getElementById('cohereKey').value = data.cohereKey || '';
    document.getElementById('summaryLength').value = data.summaryLength || 'medium';
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    const cohereKey = document.getElementById('cohereKey').value.trim();
    const summaryLength = document.getElementById('summaryLength').value;
    
    chrome.storage.sync.set({ 
      cohereKey,
      summaryLength 
    }, () => {
      // Send message to all tabs to update length setting
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateLengthSetting",
            length: summaryLength
          }).catch(() => {});
        });
      });
      
      document.getElementById('status').textContent = 'Settings saved!';
      setTimeout(() => {
        document.getElementById('status').textContent = '';
      }, 2000);
    });
  });
});