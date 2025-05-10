// document.addEventListener('DOMContentLoaded', () => {
//   const apiKeyInput = document.getElementById('api-key');
//   const providerSelect = document.getElementById('provider');
//   const modelSelect = document.getElementById('model');
//   const temperatureInput = document.getElementById('temperature');
//   const temperatureValue = document.getElementById('temperature-value');
//   const defaultLengthSelect = document.getElementById('default-length');
//   const saveButton = document.getElementById('save-button');
//   const statusMessage = document.getElementById('status-message');

//   // Load saved settings
//   chrome.storage.sync.get([
//     'apiKey', 'provider', 'model', 'temperature', 'defaultLength'
//   ], (result) => {
//     apiKeyInput.value = result.apiKey || '';
//     providerSelect.value = result.provider || 'openai';
//     modelSelect.value = result.model || 'gpt-3.5-turbo';
//     temperatureInput.value = result.temperature || 0.7;
//     temperatureValue.textContent = result.temperature || 0.7;
//     defaultLengthSelect.value = result.defaultLength || 'medium';
//   });

//   // Update temperature value display
//   temperatureInput.addEventListener('input', () => {
//     temperatureValue.textContent = temperatureInput.value;
//   });

//   // Save settings
//   saveButton.addEventListener('click', () => {
//     const settings = {
//       apiKey: apiKeyInput.value,
//       provider: providerSelect.value,
//       model: modelSelect.value,
//       temperature: parseFloat(temperatureInput.value),
//       defaultLength: defaultLengthSelect.value
//     };

//     chrome.storage.sync.set(settings, () => {
//       statusMessage.textContent = 'Settings saved successfully!';
//       setTimeout(() => {
//         statusMessage.textContent = '';
//       }, 2000);
//     });
//   });

//   providerSelect.addEventListener('change', (e) => {
//     modelSelect.disabled = e.target.value === 'claude';
//   });
// });

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