//console.log("EduSuggest highlighter script loaded");

const HIGHLIGHT_COLORS = {
  yellow: "#FFD700",
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

function getAllNodesInRange(range) {
  const nodes = [];
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        if (range.intersectsNode(node) && node.textContent.trim().length > 0) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    nodes.push(node);
  }
  return nodes;
}

function isNodeHighlighted(node) {
  let current = node;
  while (current) {
    if (current.classList?.contains('edusuggest-highlight') ||
      current.tagName?.toLowerCase() === 'mark') {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function highlightSelection(range, color) {
  if (range.collapsed) {
    //   console.log("Range is collapsed");
    return null;
  }

  const timestamp = Date.now().toString();
  const allNodes = getAllNodesInRange(range);
  const highlightedElements = [];
  let completeText = '';
  let firstMark = null;

  // Define block-level elements that should trigger line breaks
  const blockElements = new Set([
    'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'DIV', 'ARTICLE', 'SECTION', 'BLOCKQUOTE',
    'PRE', 'UL', 'OL', 'LI'
  ]);

  allNodes.forEach((node, index) => {
    if (isNodeHighlighted(node)) {
      //   console.log("Node is already highlighted");
      return;
    }

    // Create a new range for this node
    const nodeRange = document.createRange();
    nodeRange.selectNode(node);

    // Adjust range if this node is at the start or end of the selection
    if (node === range.startContainer) {
      nodeRange.setStart(node, range.startOffset);
    }
    if (node === range.endContainer) {
      nodeRange.setEnd(node, range.endOffset);
    }

    const mark = document.createElement("mark");
    mark.className = "edusuggest-highlight";
    mark.style.backgroundColor = color;
    mark.dataset.timestamp = timestamp;

    try {
      nodeRange.surroundContents(mark);
      highlightedElements.push(mark);

      if (completeText && mark.textContent.trim()) {
        const currentParent = findBlockParent(mark);
        const previousMark = highlightedElements[highlightedElements.length - 2];
        const previousParent = previousMark ? findBlockParent(previousMark) : null;

        // Check if we need to add spacing
        if (shouldAddNewline(mark, previousMark, currentParent, previousParent, blockElements)) {
          completeText += '\n\n';
        } else if (shouldAddSpace(mark, previousMark)) {
          // Add space if needed between inline elements
          completeText += ' ';
        }
      }

      completeText += mark.textContent.trim();
      if (!firstMark) firstMark = mark;
    } catch (e) {
      console.warn("Could not highlight node:", e);
    }
  });

  if (completeText && firstMark) {
    saveHighlight(completeText, color, firstMark, highlightedElements);
  }

  return highlightedElements.length > 0 ? firstMark : null;
}

// Helper function to determine if we should add a newline
function shouldAddNewline(currentMark, previousMark, currentParent, previousParent, blockElements) {
  return currentParent && previousParent &&
    currentParent !== previousParent &&
    blockElements.has(currentParent.tagName);
}

// Helper function to determine if we should add a space
function shouldAddSpace(currentMark, previousMark) {
  if (!previousMark) return false;

  // Get the actual text nodes
  const currentText = currentMark.textContent.trim();
  const previousText = previousMark.textContent.trim();

  // Check if we're dealing with different elements
  const isDifferentElements = currentMark.parentElement !== previousMark.parentElement;

  // Check if the last character of previous text and first character of current text
  // need a space between them
  const lastChar = previousText[previousText.length - 1];
  const firstChar = currentText[0];

  // Check if the elements are adjacent in the DOM
  const areAdjacent = isAdjacentInDOM(previousMark, currentMark);

  return isDifferentElements && areAdjacent &&
    needsSpaceBetween(lastChar, firstChar);
}

// Helper function to check if two characters need a space between them
function needsSpaceBetween(char1, char2) {
  if (!char1 || !char2) return false;

  // Don't add space if either character is punctuation
  const isPunctuation = char => /[.,!?;:)}\]>]/.test(char);
  const isOpeningChar = char => /[({\[<]/.test(char);

  if (isPunctuation(char2) || isOpeningChar(char1)) return false;

  // Add space if both characters are alphanumeric
  return /[\w]/.test(char1) && /[\w]/.test(char2);
}

// Helper function to check if elements are adjacent in DOM
function isAdjacentInDOM(elem1, elem2) {
  if (!elem1 || !elem2) return false;

  const range = document.createRange();
  range.setStartAfter(elem1);
  range.setEndBefore(elem2);

  // If the range is collapsed, the elements are adjacent
  return range.collapsed || !range.toString().trim();
}

// Previous helper functions remain the same
function findBlockParent(element) {
  const blockElements = new Set([
    'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'DIV', 'ARTICLE', 'SECTION', 'BLOCKQUOTE',
    'PRE', 'UL', 'OL', 'LI', 'SPAN'
  ]);

  let current = element;
  while (current && current.parentElement) {
    current = current.parentElement;
    if (blockElements.has(current.tagName)) {
      return current;
    }
  }
  return null;
}

// Update getAllNodesInRange to be more precise
function getAllNodesInRange(range) {
  const nodes = [];
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        // Check if the node intersects with the range
        if (!range.intersectsNode(node)) {
          return NodeFilter.FILTER_REJECT;
        }

        // For the start and end containers, check if the node's content
        // is actually within the selection
        if (node === range.startContainer || node === range.endContainer) {
          const nodeRange = document.createRange();
          nodeRange.selectNode(node);
          if (range.compareBoundaryPoints(Range.START_TO_START, nodeRange) === 1 &&
            range.compareBoundaryPoints(Range.END_TO_END, nodeRange) === -1) {
            return NodeFilter.FILTER_REJECT;
          }
        }

        return node.textContent.trim().length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    nodes.push(node);
  }
  return nodes;
}

function isAlreadyHighlighted(range) {
  const container = range.commonAncestorContainer;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    if (range.intersectsNode(node) &&
      (node.classList?.contains('edusuggest-highlight') ||
        node.tagName?.toLowerCase() === 'mark')) {
      return true;
    }
  }
  return false;
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
          const highlightedElements = highlightSelection(range, color);
          if (highlightedElements) {
            removeHighlightOptions();
          }
          selection.removeAllRanges();
        });
      });
  }
});

async function extractKeywords(text) {
  try {
    const response = await fetch('https://iumairshuja.pythonanywhere.com/extract_keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text })
    });
    const keywords = await response.json();
    console.log('KEYWORDS:', keywords);
    return keywords;
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
}

async function saveHighlight(text, color, element, allElements) {
  const keywords = await extractKeywords(text);

  // Collect all parent elements' information with offsets
  const elementInfos = allElements.map(el => {
    const parentNode = el.parentElement;

    // Create a temporary range to get proper text offsets
    const tempRange = document.createRange();
    tempRange.selectNodeContents(parentNode);

    // Get all text nodes in the parent
    const textNodes = [];
    const walker = document.createTreeWalker(
      parentNode,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Calculate cumulative offset
    let startOffset = 0;
    let foundStart = false;
    for (const textNode of textNodes) {
      if (textNode === el.firstChild || textNode.parentNode === el) {
        foundStart = true;
        break;
      }
      startOffset += textNode.length;
    }

    return {
      tagName: parentNode.tagName,
      className: parentNode.className,
      innerHTML: parentNode.innerHTML,
      textContent: parentNode.textContent,
      highlightedText: el.textContent,
      path: getElementPath(parentNode),
      startOffset: startOffset,
      endOffset: startOffset + el.textContent.length,
      originalHTML: parentNode.innerHTML // Store original HTML structure
    };
  });

  const highlight = {
    text: text,
    color: color,
    url: window.location.href,
    timestamp: parseInt(element.dataset.timestamp),
    keywords: keywords,
    elementInfos: elementInfos
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
        console.log("Highlight saved successfully");
      }
    });
  });
}

function getElementPath(element) {
  const path = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.className) {
      selector += `.${current.className.split(' ').join('.')}`;
    }
    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

function restoreHighlights() {
  //console.log("Attempting to restore highlights");
  chrome.storage.local.get('highlights', (data) => {
    //  console.log("Retrieved highlights from storage:", data.highlights);
    const highlights = data.highlights || [];
    if (!Array.isArray(highlights)) {
      //  console.error('Highlights is not an array:', highlights);
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
    //  console.log(`Processing highlight ${index + 1}`);

    highlight.elementInfos.forEach((elementInfo) => {
      //  console.log('Processing element with text:', elementInfo.highlightedText);

      // First try to find by path
      let element = findElementByPath(elementInfo.path);
      //  console.log('Found element by path:', !!element);

      // If element found but text doesn't match, try to find by content
      if (element && !element.textContent.includes(elementInfo.highlightedText)) {
        //  console.log('Element found but text doesnt match, searching by content...');
        element = findElementByContent(elementInfo.highlightedText);
      }

      if (!element) {
        //  console.log('Element not found by path, searching by content...');
        element = findElementByContent(elementInfo.highlightedText);
      }

      if (element) {
        //  console.log('Found element with text:', element.textContent);
        highlightTextInElement(element, elementInfo, highlight.color, highlight.timestamp);
      } else {
        console.log('Could not find element containing:', elementInfo.highlightedText);
      }
    });
  });
}

function findElementByContent(searchText) {
  // First try exact match
  const xpath = `//text()[contains(., '${searchText.replace(/'/g, "\'")}')]`;
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  let node = result.singleNodeValue;

  if (node) {
    //  console.log('Found text node by XPath');
    return node.parentNode;
  }

  // If no exact match, try finding closest container
  const allElements = document.getElementsByTagName('*');
  for (const element of allElements) {
    if (element.textContent.includes(searchText)) {
      //   console.log('Found containing element');
      return element;
    }
  }

  return null;
}

function highlightTextInElement(element, elementInfo, color, timestamp) {
  //console.log('Attempting to highlight in element:', element.tagName);

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  let highlightApplied = false;

  // Fixed the while loop condition
  while ((node = walker.nextNode()) && !highlightApplied) {
    // Add null check
    if (!node || !node.textContent) {
      //console.log('Invalid text node found, skipping...', node.textContent);
      continue;
    }

    //console.log('Checking text node:', node.textContent);

    if (node.textContent.includes(elementInfo.highlightedText)) {
      try {
        const range = document.createRange();
        const startIndex = node.textContent.indexOf(elementInfo.highlightedText);
        range.setStart(node, startIndex);
        range.setEnd(node, startIndex + elementInfo.highlightedText.length);

        const mark = document.createElement('mark');
        mark.className = "edusuggest-highlight";
        mark.style.backgroundColor = color;
        mark.dataset.timestamp = timestamp.toString();

        //  console.log('Attempting to surround contents');
        range.surroundContents(mark);
        //  console.log('Successfully highlighted text');
        highlightApplied = true;
      } catch (e) {
        console.error('Error highlighting text:', e, node.textContent);
        // If surroundContents fails, try an alternative approach
        try {
          const range = document.createRange();
          range.selectNode(node);
          const mark = document.createElement('mark');
          mark.className = "edusuggest-highlight";
          mark.style.backgroundColor = color;
          mark.dataset.timestamp = timestamp.toString();
          mark.textContent = elementInfo.highlightedText;
          node.parentNode.replaceChild(mark, node);
          //  console.log('Successfully highlighted text using alternative method');
          highlightApplied = true;
        } catch (e2) {
          console.error('Alternative highlighting method failed:', e2);
        }
      }
    }
  }

  if (!highlightApplied) {
    // Try one more approach if previous methods failed
    try {
      const textContent = element.textContent;
      const startIndex = textContent.indexOf(elementInfo.highlightedText);

      if (startIndex !== -1) {
        const range = document.createRange();
        let currentNode = element.firstChild;
        let currentIndex = 0;

        // Find the correct text node and offset
        while (currentNode) {
          if (currentNode.nodeType === Node.TEXT_NODE) {
            const nodeLength = currentNode.textContent.length;
            if (currentIndex <= startIndex && startIndex < currentIndex + nodeLength) {
              const localOffset = startIndex - currentIndex;
              range.setStart(currentNode, localOffset);
              range.setEnd(currentNode, localOffset + elementInfo.highlightedText.length);

              const mark = document.createElement('mark');
              mark.className = "edusuggest-highlight";
              mark.style.backgroundColor = color;
              mark.dataset.timestamp = timestamp.toString();

              range.surroundContents(mark);
              //  console.log('Successfully highlighted text using final method');
              highlightApplied = true;
              break;
            }
            currentIndex += nodeLength;
          }
          currentNode = currentNode.nextSibling;
        }
      }
    } catch (e) {
      console.error('Final highlighting attempt failed:', e);
    }
  }

  if (!highlightApplied) {
    console.log('Could not apply highlight to found element');
  }
}

function findElementByPath(path) {
  try {
    // Try direct querySelector first
    let element = document.querySelector(path);

    // If that fails, try a more flexible approach
    if (!element) {
      const parts = path.split(' > ');
      const lastPart = parts[parts.length - 1];
      element = document.querySelector(lastPart);
    }

    return element;
  } catch (e) {
    // console.error('Error finding element by path:', e);
    return null;
  }
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

document.addEventListener('DOMContentLoaded', restoreHighlights);
window.addEventListener('load', restoreHighlights);
restoreHighlights();

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('edusuggest-highlight') ||
    (e.target.tagName.toLowerCase() === 'mark' && e.target.classList.contains('edusuggest-highlight'))) {
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
  const highlights = document.querySelectorAll('mark.edusuggest-highlight');
  for (const highlight of highlights) {
    if (highlight.textContent.includes(text) && highlight.dataset.timestamp === timestamp.toString()) {
      return highlight;
    }
  }

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