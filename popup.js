document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const highlightsList = document.getElementById("recent-highlights");
  const viewAllBtn = document.getElementById("view-all-highlights");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // Define these functions first
  function viewHighlight(highlight, index) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab.url === highlight.url) {
        // If we're already on the correct page, just scroll to the highlight
        chrome.tabs.sendMessage(currentTab.id, {
          action: "scrollToHighlight",
          highlightText: highlight.text,
          timestamp: highlight.timestamp,
        });
        window.close();
      } else {
        // Navigate to the page with the highlight
        chrome.tabs.update(
          currentTab.id,
          { url: highlight.url },
          function (tab) {
            // Wait for the page to load, then scroll to the highlight
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === tab.id && info.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.sendMessage(tabId, {
                  action: "scrollToHighlight",
                  highlightText: highlight.text,
                  timestamp: highlight.timestamp,
                });
                window.close();
              }
            });
          }
        );
      }
    });
  }

  function deleteHighlight(index) {
    chrome.storage.local.get("highlights", (result) => {
      const highlights = result.highlights || [];
      highlights.splice(index, 1);
      chrome.storage.local.set({ highlights }, loadHighlights);
    });
  }

  function loadHighlights() {
    chrome.storage.local.get("highlights", (result) => {
      const highlights = result.highlights || [];
      highlightsList.innerHTML = "";
      if (Array.isArray(highlights)) {
        if (highlights.length === 0) {
          highlightsList.innerHTML = "<div>No highlights found</div>";
        } else {
          // Iterate through the highlights in reverse order
          for (let i = highlights.length - 1; i >= 0; i--) {
            const highlight = highlights[i];
            const li = document.createElement("li");
            li.classList.add("highlight-item", "animate__animated", "animate__fadeIn");

            // Process the text with both line breaks and sentence limiting
            const processedText = highlight.text
              .split(/[.!?]+/).slice(0, 2).join('.') + (highlight.text.split(/[.!?]+/).length > 2 ? '.' : '');

            li.innerHTML = `
            <div class="highlight-content">
              <div class="highlight-text">
                ${processedText}
              </div>
              <div class="highlight-actions">
                <button class="view-btn" title="View highlight">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="delete-btn" title="Delete highlight">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `;

            li.querySelector(".view-btn").addEventListener("click", () =>
              viewHighlight(highlight, i)
            );
            li.querySelector(".delete-btn").addEventListener("click", () =>
              deleteHighlight(i)
            );
            highlightsList.appendChild(li);
          }
        }
      } else {
        console.error("Highlights is not an array:", highlights);
        highlightsList.innerHTML =
          "<li>Error: Highlights data is invalid. Please check the console for more information.</li>";
      }
    });
  }

  // View All Highlights button
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "highlights.html" });
    });
  }

  // Tab switching functionality
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");

      // Update active states
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(tabName)?.classList.add("active");
    });
  });

  // Initial load
  loadHighlights();

});
