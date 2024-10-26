from flask import Flask, request, jsonify
from flask_cors import CORS
from rake_nltk import Rake
import logging
import nltk

# Ensure NLTK resources are downloaded
nltk.download('punkt_tab')
nltk.download('stopwords')

app = Flask(__name__)

# Enable CORS for all routes and allow all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Set up logging
logging.basicConfig(level=logging.DEBUG)

@app.route('/extract_keywords', methods=['POST'])
def extract_keywords():
    try:
        data = request.json
        if not data or 'text' not in data:
            logging.error("Invalid input data")
            return jsonify({"error": "Invalid input data"}), 400
        
        text = data.get('text', '')
        logging.debug(f"Received text: {text}")
        
        # Initialize Rake with a custom sentence tokenizer
        r = Rake()
        r.extract_keywords_from_text(text)
        keywords = r.get_ranked_phrases_with_scores()
        
        logging.debug(f"Extracted keywords: {keywords}")
        return jsonify(keywords)
    except Exception as e:
        logging.exception("An error occurred while extracting keywords")
        return jsonify({"error": "An internal error occurred"}), 500

if __name__ == '__main__':
    app.run(port=5000)