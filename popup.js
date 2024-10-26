document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const highlightsList = document.getElementById('highlightsList');
  const suggestionsList = document.getElementById('suggestionsList');
  const settingsForm = document.getElementById('settingsForm');

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => {
        content.classList.remove('active');
        content.classList.remove('fade-in-scale');
      });
      button.classList.add('active');
      const tabContent = document.getElementById(button.dataset.tab);
      tabContent.classList.add('active');
      setTimeout(() => {
        tabContent.classList.add('fade-in-scale');
      }, 10);
    });
  });

  // Load highlights
  function loadHighlights() {
    chrome.storage.local.get('highlights', (result) => {
      console.log('Retrieved highlights:', result.highlights); // Debug log
      const highlights = result.highlights || [];
      highlightsList.innerHTML = '';
      if (Array.isArray(highlights)) {
        if (highlights.length === 0) {
          highlightsList.innerHTML = '<li>No highlights found</li>';
        } else {
          highlights.forEach((highlight, index) => {
            const li = document.createElement('li');
            li.classList.add('highlight-item', 'animate__animated', 'animate__fadeIn');
            li.innerHTML = `
              <div class="highlight-text" style="background-color: ${highlight.color}">
                ${highlight.text.substring(0, 50)}${highlight.text.length > 50 ? '...' : ''}
              </div>
              <div class="highlight-actions">
                <button class="view-btn">View</button>
                <button class="delete-btn">Delete</button>
              </div>
            `;
            li.querySelector('.view-btn').addEventListener('click', () => viewHighlight(highlight, index));
            li.querySelector('.delete-btn').addEventListener('click', () => deleteHighlight(index));
            highlightsList.appendChild(li);
          });
        }
      } else {
        console.error('Highlights is not an array:', highlights);
        highlightsList.innerHTML = '<li>Error: Highlights data is invalid. Please check the console for more information.</li>';
      }
    });
  }

  // Event listener for "View All Highlights" button
  document.getElementById('view-all-highlights').addEventListener('click', function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("highlights.html") });
  });

  function viewHighlight(highlight, index) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab.url === highlight.url) {
        // If we're already on the correct page, just scroll to the highlight
        chrome.tabs.sendMessage(currentTab.id, {
          action: "scrollToHighlight",
          highlightText: highlight.text,
          timestamp: highlight.timestamp
        });
        window.close();
      } else {
        // Navigate to the page with the highlight
        chrome.tabs.update(currentTab.id, { url: highlight.url }, function (tab) {
          // Wait for the page to load, then scroll to the highlight
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              chrome.tabs.sendMessage(tabId, {
                action: "scrollToHighlight",
                highlightText: highlight.text,
                timestamp: highlight.timestamp
              });
              window.close();
            }
          });
        });
      }
    });
  }

  function deleteHighlight(index) {
    chrome.storage.local.get('highlights', (result) => {
      const highlights = result.highlights || [];
      highlights.splice(index, 1);
      chrome.storage.local.set({ highlights }, loadHighlights);
    });
  }

  // Load suggestions (placeholder)
  function loadSuggestions() {
    const placeholderSuggestions = [
      'How to improve your study habits',
      'The importance of active recall in learning',
      'Effective note-taking strategies for students'
    ];
    suggestionsList.innerHTML = '';
    placeholderSuggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.textContent = suggestion;
      li.classList.add('fade-in-scale');
      suggestionsList.appendChild(li);
    });
  }

  // Settings form submission
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const theme = document.getElementById('theme').value;
    chrome.storage.local.set({ username, theme }, () => {
      alert('Settings saved!');
      applyTheme(theme);
    });
  });

  // Load settings
  function loadSettings() {
    chrome.storage.local.get(['username', 'theme'], (result) => {
      if (result.username) {
        document.getElementById('username').value = result.username;
        document.querySelector('.username').textContent = result.username;
      }
      if (result.theme) {
        document.getElementById('theme').value = result.theme;
        applyTheme(result.theme);
      }
    });
  }

  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
  }

  loadHighlights();
  loadSuggestions();
  loadSettings();


});