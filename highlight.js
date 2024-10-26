document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('highlights-container');
    const menu = document.getElementById('menu');
    const searchContainer = document.getElementById('search-container');
    const dateContainer = document.getElementById('date-container');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');
    const backButton = document.getElementById('back-btn');
    const dateInput = document.getElementById('date-input');
    const dateSearchButton = document.getElementById('date-search-btn');
    const backDateButton = document.getElementById('back-date-btn');
    const viewAllButton = document.getElementById('view-all');
    const deleteAllButton = document.getElementById('delete-all');

    let allHighlights = [];

    function extractWebsiteName(url) {
        try {
            const hostname = new URL(url).hostname;
            return hostname.replace(/^www\./i, '').split('.')[0];
        } catch (error) {
            console.error('Invalid URL:', url);
            return 'Unknown';
        }
    }

    function formatDate(timestamp) {
        try {
            return new Date(timestamp).toLocaleString('default', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    }

    function updateHighlightTimes() {
        document.querySelectorAll('.highlight-date').forEach(element => {
            const timestamp = parseInt(element.dataset.timestamp);
            element.textContent = formatDate(timestamp);
        });
    }

    function loadHighlights(showAll = false) {
        try {
            chrome.storage.local.get('highlights', (data) => {
                allHighlights = data.highlights || [];
                allHighlights.sort((a, b) => b.timestamp - a.timestamp);
                displayHighlights(showAll ? allHighlights : allHighlights.slice(0, 3));
                updateMenuVisibility(showAll);
            });
        } catch (error) {
            console.error('Error loading highlights:', error);
            container.innerHTML = '<p>Error loading highlights. Please try reloading the page.</p>';
        }
    }

    function updateMenuVisibility(showAll) {
        menu.style.display = showAll ? 'none' : 'flex';
        viewAllButton.style.display = showAll ? 'none' : 'inline-block';
        const backToMainButton = document.getElementById('back-to-main');
        if (showAll) {
            if (!backToMainButton) {
                const newBackButton = document.createElement('button');
                newBackButton.id = 'back-to-main';
                newBackButton.className = 'menu-btn';
                newBackButton.textContent = 'Back to Main';
                newBackButton.addEventListener('click', () => loadHighlights(false));
                container.insertBefore(newBackButton, container.firstChild);
            }
        } else {
            if (backToMainButton) {
                backToMainButton.remove();
            }
        }
    }

    function displayHighlights(highlights) {
        container.innerHTML = ''; // Clear previous highlights

        if (highlights.length === 0) {
            container.innerHTML = '<p>No highlights found.</p>';
            return;
        }

        highlights.forEach(highlight => {
            const websiteName = extractWebsiteName(highlight.url);

            const highlightElement = document.createElement('div');
            highlightElement.className = 'highlight';
            highlightElement.innerHTML = `
        <div class="highlight-text">
          <span class="highlight-color" style="background-color: ${highlight.color};"></span>
          "${highlight.text}"
        </div>
        <div class="highlight-info">
          URL: ${highlight.url || 'N/A'}<br>
          Date: <span class="highlight-date" data-timestamp="${highlight.timestamp}"></span>
        </div>
        <button class="delete-btn" data-id="${highlight.timestamp}">Delete</button>
      `;
            container.appendChild(highlightElement);
        });

        updateHighlightTimes();
        attachDeleteListeners();
    }

    function attachDeleteListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function () {
                const highlightId = parseInt(this.getAttribute('data-id'));
                deleteHighlight(highlightId);
            });
        });
    }

    function deleteHighlight(highlightId) {
        allHighlights = allHighlights.filter(highlight => highlight.timestamp !== highlightId);
        chrome.storage.local.set({ highlights: allHighlights }, () => {
            loadHighlights(false);
        });
    }

    function deleteAllHighlights() {
        if (confirm('Are you sure you want to delete all highlights? This action cannot be undone.')) {
            allHighlights = [];
            chrome.storage.local.set({ highlights: allHighlights }, () => {
                loadHighlights(false);
            });
        }
    }

    function showSearch(type) {
        menu.style.display = 'none';
        searchContainer.style.display = 'none';
        dateContainer.style.display = 'none';

        if (type === 'keyword') {
            searchContainer.style.display = 'flex';
        } else if (type === 'datetime') {
            dateContainer.style.display = 'flex';
        }
    }

    function performSearch(searchTerm, searchType) {
        if (!searchTerm.trim()) {
            throw new Error('Empty field');
        }

        const filteredHighlights = allHighlights.filter(highlight => {
            if (searchType === 'keyword') {
                return highlight.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    highlight.url.toLowerCase().includes(searchTerm.toLowerCase());
            } else if (searchType === 'datetime') {
                const highlightDate = new Date(highlight.timestamp);
                const searchDate = new Date(searchTerm);
                return highlightDate.toDateString() === searchDate.toDateString();
            }
        });

        if (filteredHighlights.length === 0) {
            container.innerHTML = '<p>No matching highlights found.</p>';
        } else {
            displayHighlights(filteredHighlights);
        }
    }

    backButton.onclick = () => {
        searchContainer.style.display = 'none';
        menu.style.display = 'flex';
        loadHighlights(false);
    };

    backDateButton.onclick = () => {
        dateContainer.style.display = 'none';
        menu.style.display = 'flex';
        loadHighlights(false);
    };

    searchButton.onclick = () => {
        try {
            const searchTerm = searchInput.value;
            performSearch(searchTerm, 'keyword');
        } catch (error) {
            alert(error.message);
        }
    };

    dateSearchButton.onclick = () => {
        try {
            const searchDate = dateInput.value;
            performSearch(searchDate, 'datetime');
        } catch (error) {
            alert(error.message);
        }
    };

    // Menu button listeners
    document.getElementById('search-keyword').addEventListener('click', () => showSearch('keyword'));
    document.getElementById('search-website').addEventListener('click', () => showSearch('keyword'));
    document.getElementById('search-datetime').addEventListener('click', () => showSearch('datetime'));
    viewAllButton.addEventListener('click', () => loadHighlights(true));
    deleteAllButton.addEventListener('click', deleteAllHighlights);

    loadHighlights(false);

    // Update times every minute
    setInterval(updateHighlightTimes, 60000);
});