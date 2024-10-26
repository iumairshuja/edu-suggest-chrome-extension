chrome.runtime.onInstalled.addListener(() => {
  console.log('EduSuggest installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveHighlight') {
    saveHighlight(request.text, request.color, request.url, request.xpath, request.timestamp);
  } else if (request.action === 'getHighlights') {
    getHighlights(request.url, sendResponse);
    return true; // Indicates that the response is asynchronous
  }
});

function saveHighlight(text, color, url, xpath, timestamp) {
  chrome.storage.local.get('highlights', (result) => {
    const highlights = result.highlights || {};
    if (!highlights[url]) {
      highlights[url] = [];
    }
    highlights[url].push({ text, color, xpath, timestamp });
    chrome.storage.local.set({ highlights }, () => {
      console.log('Highlight saved:', { text, color, url, xpath, timestamp });
    });
  });
}

function getHighlights(url, sendResponse) {
  chrome.storage.local.get('highlights', (result) => {
    const highlights = result.highlights || {};
    sendResponse({ highlights: highlights[url] || [] });
  });
}