from flask import Flask, request, jsonify
from flask_cors import CORS
from rake_nltk import Rake
import logging
import nltk
from rake_nltk import Metric

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
        
        # Initialize Rake with optimized parameters
        r = Rake(
            min_length=1,  # Allow single word keywords
            max_length=2,  # Maximum 2 words per keyword
            ranking_metric=Metric.DEGREE_TO_FREQUENCY_RATIO,  # Best metric for keyword relevance
            include_repeated_phrases=False  # Avoid duplicate phrases
        )
        
        r.extract_keywords_from_text(text)
        # Get all keywords with scores and take top 5
        keywords = r.get_ranked_phrases_with_scores()[:10]
        
        # Format the response as a list of [score, phrase] pairs
        formatted_keywords = [
            {
                "score": round(score, 10),  # Round score to 4 decimal places
                "keyword": phrase.strip()  # Clean up any extra whitespace
            }
            for score, phrase in keywords
        ]
        
        logging.debug(f"Extracted keywords: {formatted_keywords}")
        return jsonify(formatted_keywords)
        
    except Exception as e:
        logging.exception("An error occurred while extracting keywords")
        return jsonify({"error": "An internal error occurred"}), 500

if __name__ == '__main__':
    app.run(port=5000)
