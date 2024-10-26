console.log("EduSuggest highlighter script loaded");

const HIGHLIGHT_COLORS = {
  yellow: "#FFD700", // Changed to a darker yellow (gold)
  blue: "#2196F3",
};

let allHighlights = [];

function createHighlightOptions(range) {
  const rect = range.getBoundingClientRect();
  const options = document.createElement("div");
  options.className = "edusuggest-highlight-options";
  options.innerHTML = `
    <button class="edusuggest-highlight-color" data-color="yellow"></button>
    <button class="edusuggest-highlight-color" data-color="blue"></button>
  `;
  options.style.position = "absolute";
  options.style.left = `${rect.left + window.scrollX}px`;
  options.style.top = `${rect.top + window.scrollY - 40}px`;
  document.body.appendChild(options);
  return options;
}

function highlightSelection(range, color) {
  if (isAlreadyHighlighted(range)) {
    console.log("This text is already highlighted");
    return null;
  }

  const span = document.createElement("span");
  span.className = "edusuggest-highlight";
  span.style.backgroundColor = color;
  span.dataset.timestamp = Date.now().toString();

  const contents = range.extractContents();
  span.appendChild(contents);
  range.insertNode(span);

  saveHighlight(span.textContent, color, span);

  return span;
}

function isAlreadyHighlighted(range) {
  const parentElement = range.commonAncestorContainer.parentElement;
  return parentElement && parentElement.classList.contains('edusuggest-highlight');
}

function removeHighlightOptions() {
  const options = document.querySelector(".edusuggest-highlight-options");
  if (options) {
    options.remove();
  }
}

document.addEventListener("mouseup", (e) => {
  removeHighlightOptions();

  const selection = window.getSelection();
  if (selection.toString().length > 0) {
    const range = selection.getRangeAt(0);

    // Check if the selection is already highlighted
    if (isAlreadyHighlighted(range)) {
      console.log("This text is already highlighted");
      return;
    }

    const options = createHighlightOptions(range);

    options
      .querySelectorAll(".edusuggest-highlight-color")
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const color = HIGHLIGHT_COLORS[button.dataset.color];
          const highlightedSpan = highlightSelection(range, color);
          if (highlightedSpan) {
            removeHighlightOptions();
            saveHighlight(
              highlightedSpan.textContent,
              color,
              range.commonAncestorContainer
            );
          }
          selection.removeAllRanges();
        });
      });
  }
});

function saveHighlight(text, color, element) {
  const highlight = {
    text: text,
    color: color,
    url: window.location.href,
    timestamp: Date.now(),
    elementInfo: {
      tagName: element.tagName,
      innerHTML: element.innerHTML,
      outerHTML: element.outerHTML,
      textContent: element.textContent,
      attributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      }))
    }
  };

  console.log("Attempting to save highlight:", highlight);

  chrome.storage.local.get('highlights', (data) => {
    let highlights = data.highlights || [];
    if (!Array.isArray(highlights)) {
      console.error('Highlights is not an array, resetting to empty array');
      highlights = [];
    }
    highlights.push(highlight);
    chrome.storage.local.set({ highlights: highlights }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving highlight:", chrome.runtime.lastError);
      } else {
        console.log("Highlight saved successfully. New highlights array:", highlights);
      }
    });
  });

  // Send the highlighted text to the Flask server for keyword extraction
  fetch('http://localhost:5000/extract_keywords', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: text })
  })
    .then(response => response.json())
    .then(keywords => {
      console.log('KEYWORDS:', keywords);
    })
    .catch(error => {
      console.error('Error extracting keywords:', error);
    });
}

function getXPathForElement(element) {
  if (element.nodeType !== Node.ELEMENT_NODE) {
    element = element.parentNode;
  }
  if (element.id !== "") return 'id("' + element.id + '")';
  if (element === document.body) return element.tagName;

  let ix = 0;
  const siblings = element.parentNode.childNodes;
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element)
      return (
        getXPathForElement(element.parentNode) +
        "/" +
        element.tagName +
        "[" +
        (ix + 1) +
        "]"
      );
    if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) ix++;
  }
}

function restoreHighlights() {
  console.log("Attempting to restore highlights");
  chrome.storage.local.get('highlights', (data) => {
    console.log("Retrieved highlights from storage:", data.highlights);
    const highlights = data.highlights || [];
    if (!Array.isArray(highlights)) {
      console.error('Highlights is not an array:', highlights);
      return;
    }
    const pageHighlights = highlights.filter(h => h.url === window.location.href);
    console.log("Highlights for this page:", pageHighlights);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => applyHighlights(pageHighlights));
    } else {
      applyHighlights(pageHighlights);
    }
  });
}

function applyHighlights(highlights) {
  highlights.forEach((highlight, index) => {
    console.log(`Attempting to apply highlight ${index + 1}/${highlights.length}:`, highlight);
    const element = findElementForHighlight(highlight);
    if (element) {
      applyHighlightToElement(element, highlight);
      console.log(`Highlight ${index + 1} applied successfully:`, highlight);
    } else {
      console.warn(`Could not find element for highlight ${index + 1}:`, highlight);
      // Optionally, you could try to find the text anywhere in the document and highlight it
      const range = findRangeForHighlight(highlight);
      if (range) {
        const span = document.createElement('span');
        span.className = "edusuggest-highlight";
        span.style.backgroundColor = highlight.color;
        span.dataset.timestamp = highlight.timestamp.toString();
        range.surroundContents(span);
        console.log(`Highlight ${index + 1} applied using fallback method:`, highlight);
      } else {
        console.error(`Could not apply highlight ${index + 1}:`, highlight);
      }
    }
  });
}

function findElementForHighlight(highlight) {
  if (!highlight.elementInfo || !highlight.elementInfo.tagName) {
    console.warn('Highlight does not have elementInfo:', highlight);
    return findElementByText(highlight.text);
  }

  const elements = document.getElementsByTagName(highlight.elementInfo.tagName);
  for (const element of elements) {
    if (element.innerHTML === highlight.elementInfo.innerHTML) {
      return element;
    }
  }

  // If exact match is not found, fall back to text-based search
  return findElementByText(highlight.text);
}

function findElementByText(text) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.includes(text)) {
      return node.parentElement;
    }
  }

  return null;
}

function applyHighlightToElement(element, highlight) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const span = document.createElement('span');
  span.className = "edusuggest-highlight";
  span.style.backgroundColor = highlight.color;
  span.dataset.timestamp = highlight.timestamp.toString();
  range.surroundContents(span);
}

function findRangeForHighlight(highlight) {
  console.log("Attempting to find exact match for highlight:", highlight);
  return findExactTextMatch(document.body, highlight.text);
}

function findExactTextMatch(element, searchText) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim() === searchText.trim()) {
      const range = document.createRange();
      range.selectNodeContents(node);
      console.log("Exact match found:", node.textContent);
      return range;
    }
  }

  console.log("Exact match not found for:", searchText);
  return null;
}

function findTextNodesContaining(element, searchText) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        return node.textContent.includes(searchText)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function getAllTextNodes(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function wrapTextInHighlight(textNode, highlight, startOffset, endOffset) {
  const parent = textNode.parentNode;
  const highlightSpan = document.createElement('span');
  highlightSpan.className = "edusuggest-highlight";
  highlightSpan.style.backgroundColor = highlight.color;
  highlightSpan.dataset.timestamp = highlight.timestamp.toString();

  const range = document.createRange();
  range.setStart(textNode, startOffset);
  range.setEnd(textNode, endOffset);
  range.surroundContents(highlightSpan);
}

function deleteHighlight(timestamp) {
  chrome.storage.local.get('highlights', (data) => {
    let highlights = data.highlights || [];
    highlights = highlights.filter(h => h.timestamp !== timestamp);
    chrome.storage.local.set({ highlights: highlights }, () => {
      console.log("Highlight deleted");
    });
  });
}

document.addEventListener("mousedown", (e) => {
  if (!e.target.closest(".edusuggest-highlight-options")) {
    removeHighlightOptions();
  }
});

// Restore highlights when the page loads
document.addEventListener('DOMContentLoaded', restoreHighlights);
window.addEventListener('load', restoreHighlights);

// Also restore highlights when the extension is first injected
restoreHighlights();

// Add event listener for highlight deletion
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('edusuggest-highlight')) {
    if (confirm('Do you want to delete this highlight?')) {
      const timestamp = parseInt(e.target.dataset.timestamp);
      deleteHighlight(timestamp);
      e.target.outerHTML = e.target.innerHTML;
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrollToHighlight") {
    const highlight = findHighlightByElement(request.highlightText, request.timestamp);
    if (highlight) {
      highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flashHighlight(highlight);
    } else {
      console.log("Highlight not found:", request.highlightText, request.timestamp);
    }
  }
});

function findHighlightByElement(text, timestamp) {
  const highlights = document.querySelectorAll('.edusuggest-highlight');
  for (const highlight of highlights) {
    if (highlight.textContent.includes(text) && highlight.dataset.timestamp === timestamp.toString()) {
      return highlight;
    }
  }

  // If not found, try a more lenient search
  for (const highlight of highlights) {
    if (highlight.textContent.includes(text) || highlight.dataset.timestamp === timestamp.toString()) {
      return highlight;
    }
  }

  return null;
}

function flashHighlight(element) {
  const originalColor = element.style.backgroundColor;
  element.style.transition = 'background-color 0.5s';
  element.style.backgroundColor = '#ff0';
  setTimeout(() => {
    element.style.backgroundColor = originalColor;
  }, 1000);
}
