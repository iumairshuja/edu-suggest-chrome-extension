# EduSuggest Chrome Extension

EduSuggest is a powerful Chrome extension that enhances your reading experience by allowing you to highlight important text and automatically extract keywords using machine learning. The extension then uses these keywords to suggest relevant educational content and articles.

## Features

- **Smart Text Highlighting**

  - Multiple highlight colors (Yellow and Blue)
  - Persistent highlights across sessions
  - Easy highlight management
  - Quick highlight navigation

- **Intelligent Keyword Extraction**

  - Automated keyword extraction using RAKE algorithm
  - Natural Language Processing for better accuracy
  - Real-time processing
  - Relevance scoring for keywords

- **User Interface**
  - Clean and intuitive popup interface
  - Organized highlights view
  - Easy navigation between highlights
  - Search functionality (by keyword, website, or date)

## Technology Stack

- **Frontend**

  - JavaScript/HTML/CSS
  - Chrome Extension APIs
  - Font Awesome for icons
  - Animate.css for animations

- **Backend**
  - Flask (Python web framework)
  - RAKE-NLTK for keyword extraction
  - NLTK for natural language processing
  - CORS for cross-origin resource sharing

## Installation

1. Clone the repository

bash
git clone https://github.com/iumairshuja/edu-suggest-chrome-extension.git

2. Install Python dependencies
   bash
   pip install flask flask-cors rake-nltk nltk

3. Load the extension in Chrome
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Usage

1. Select text on any webpage
2. Choose a highlight color from the popup menu
3. View extracted keywords and suggestions in the extension popup
4. Access all highlights through the "View All Highlights" page
5. Search and manage your highlights using the built-in tools

## Architecture

The extension consists of two main components:

1. **Chrome Extension**

   - Content Scripts for webpage interaction
   - Popup interface for user interaction
   - Background service worker for event handling
   - Local storage for highlight persistence

2. **Backend Server**
   - Flask REST API
   - RAKE-NLTK implementation for keyword extraction
   - Custom stopwords and filtering
   - CORS-enabled endpoints

## API Endpoints

- `POST /extract_keywords`
  - Extracts keywords from provided text
  - Returns scored and ranked keywords

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- RAKE-NLTK library for keyword extraction
- Flask framework for the backend server
- Chrome Extension APIs for browser integration
