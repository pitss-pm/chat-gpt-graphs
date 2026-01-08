/**
 * Background service worker for ChatGPTGraphs extension
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ChatGPTGraphs extension installed');
  } else if (details.reason === 'update') {
    console.log('ChatGPTGraphs extension updated');
  }
});

// Handle messages from content scripts if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'log') {
    console.log('[ChatGPTGraphs]', message.data);
  }
  return true; // Keep channel open for async response
});
