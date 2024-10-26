document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('highlights-container');
    const menu = document.getElementById('menu');
    const searchSections = document.getElementById('search-sections');

    // Initialize search buttons and inputs
    const searchKeywordBtn = document.getElementById('search-keyword');
    const searchWebsiteBtn = document.getElementById('search-website');
    const searchDatetimeBtn = document.getElementById('search-datetime');
    const searchBtn = document.getElementById('search-btn');
    const websiteSearchBtn = document.getElementById('website-search-btn');
    const dateSearchBtn = document.getElementById('date-search-btn');
    const viewAllBtn = document.getElementById('view-all');
    const deleteAllBtn = document.getElementById('delete-all');

    let allHighlights = [];

    // Define showAll as a variable at the top of your scope
    let showAll = false;  // or true, depending on your default state

    // function extractWebsiteName(url) {
    //     try {
    //         const hostname = new URL(url).hostname;
    //         return hostname.replace(/^www\./i, '').split('.')[0];
    //     } catch (error) {
    //         console.error('Invalid URL:', url);
    //         return 'Unknown';
    //     }
    // }


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

    function updateMenuVisibility(element) {
        if (element && element.style) {
            // Now showAll will be properly referenced
            element.style.display = showAll ? 'block' : 'none';
        }
        viewAllBtn.style.display = showAll ? 'none' : 'inline-block';
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
            container.innerHTML = '<p class="no-highlights">No highlights found.</p>';
            return;
        }

        highlights.forEach(highlight => {
            const highlightElement = document.createElement('div');
            highlightElement.className = 'highlight-card';

            // Truncate URL for display
            const displayUrl = new URL(highlight.url).hostname;

            highlightElement.innerHTML = `
                <div class="highlight-content">
                    <div class="highlight-text">
                        <span class="highlight-color" style="background-color: ${highlight.color};"></span>
                        <p>${highlight.text}</p>
                    </div>
                    <div class="highlight-info">
                        <a href="${highlight.url}" target="_blank" class="highlight-url">
                            <i class="fas fa-link"></i> ${displayUrl}
                        </a>
                        <span class="highlight-date" data-timestamp="${highlight.timestamp}">
                            <i class="far fa-clock"></i>
                        </span>
                    </div>
                    <button class="delete-btn" data-id="${highlight.timestamp}">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
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
        // Hide all search sections first
        document.querySelectorAll('.search-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show the selected search section
        const searchSection = document.getElementById(`${type}-search`);
        if (searchSection) {
            searchSection.classList.add('active');
            menu.style.display = 'none';

            // Focus on the appropriate input
            const input = searchSection.querySelector('input');
            if (input) input.focus();
        }
    }

    function performSearch(searchTerm, searchType) {
        if (!searchTerm.trim()) {
            throw new Error('Empty field');
        }

        const filteredHighlights = allHighlights.filter(highlight => {
            if (searchType === 'keyword') {
                return highlight.text.toLowerCase().includes(searchTerm.toLowerCase());
            } else if (searchType === 'website') {
                return highlight.url.toLowerCase().includes(searchTerm.toLowerCase());
            } else if (searchType === 'datetime') {
                const highlightDate = new Date(highlight.timestamp);
                const searchDate = new Date(searchTerm);
                return highlightDate.toDateString() === searchDate.toDateString();
            }
            return false;
        });

        if (filteredHighlights.length === 0) {
            container.innerHTML = '<p>No matching highlights found.</p>';
        } else {
            displayHighlights(filteredHighlights);
        }
    }

    // Close button functionality
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.search-section').classList.remove('active');
            menu.style.display = 'flex';
            loadHighlights(false);
        });
    });

    // Add event listeners only if elements exist
    if (searchKeywordBtn) {
        searchKeywordBtn.addEventListener('click', () => showSearch('keyword'));
    }

    if (searchWebsiteBtn) {
        searchWebsiteBtn.addEventListener('click', () => showSearch('website'));
    }

    if (searchDatetimeBtn) {
        searchDatetimeBtn.addEventListener('click', () => showSearch('datetime'));
    }

    // Search button event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                try {
                    performSearch(searchInput.value, 'keyword');
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    if (websiteSearchBtn) {
        websiteSearchBtn.addEventListener('click', () => {
            const websiteInput = document.getElementById('website-input');
            if (websiteInput) {
                try {
                    performSearch(websiteInput.value, 'website');
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    if (dateSearchBtn) {
        dateSearchBtn.addEventListener('click', () => {
            const dateInput = document.getElementById('date-input');
            if (dateInput) {
                try {
                    performSearch(dateInput.value, 'datetime');
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => loadHighlights(true));
    }

    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllHighlights);
    }

    // Load initial highlights
    loadHighlights(false);

    // Update times every minute
    setInterval(updateHighlightTimes, 60000);
});
