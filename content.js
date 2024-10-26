console.log('EduSuggest content script loaded');

let highlightColor = '#ffff00'; // Default yellow

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setHighlightColor') {
    highlightColor = request.color;
  }
});

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection.toString().length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showHighlightOptions(rect, selection);
  }
});

function showHighlightOptions(rect, selection) {
  const optionsDiv = document.createElement('div');
  optionsDiv.classList.add('edusuggest-highlight-options');
  optionsDiv.style.position = 'absolute';
  optionsDiv.style.left = `${rect.left + window.scrollX}px`;
  optionsDiv.style.top = `${rect.top + window.scrollY - 30}px`;
  optionsDiv.innerHTML = `
    <button class="edusuggest-highlight-save"><i class="fas fa-check"></i></button>
    <button class="edusuggest-highlight-cancel"><i class="fas fa-times"></i></button>
  `;

  optionsDiv.querySelector('.edusuggest-highlight-save').addEventListener('click', () => {
    highlightSelection(selection);
    optionsDiv.remove();
  });

  optionsDiv.querySelector('.edusuggest-highlight-cancel').addEventListener('click', () => {
    optionsDiv.remove();
  });

  document.body.appendChild(optionsDiv);
}

function highlightSelection(selection) {
  const range = selection.getRangeAt(0);
  const newNode = document.createElement('span');
  newNode.classList.add('edusuggest-highlight');
  newNode.style.backgroundColor = highlightColor;
  newNode.dataset.timestamp = new Date().toISOString();
  range.surroundContents(newNode);

  saveHighlight(selection.toString(), highlightColor);
}

function saveHighlight(text, color) {
  chrome.runtime.sendMessage({
    action: 'saveHighlight',
    text: text,
    color: color,
    url: window.location.href,
    timestamp: new Date().toISOString()
  });
}

// Add hover functionality to show highlight date
document.addEventListener('mouseover', (e) => {
  if (e.target.classList.contains('edusuggest-highlight')) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('edusuggest-tooltip');
    tooltip.textContent = `Highlighted on: ${new Date(e.target.dataset.timestamp).toLocaleString()}`;
    document.body.appendChild(tooltip);

    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
  }
});

document.addEventListener('mouseout', (e) => {
  if (e.target.classList.contains('edusuggest-highlight')) {
    const tooltip = document.querySelector('.edusuggest-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }
});