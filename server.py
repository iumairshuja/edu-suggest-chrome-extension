from flask import Flask, request, jsonify
from flask_cors import CORS
from rake_nltk import Rake
import logging
import nltk
from rake_nltk import Metric
import string  # Import string module for punctuation

# Ensure NLTK resources are downloaded
nltk.download('punkt_tab')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger_eng')

# Custom stop words list
custom_stopwords = set(nltk.corpus.stopwords.words('english'))

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

        # Replace sentence-ending punctuation with space to ensure proper separation
        text = text.replace('.', '. ').replace('!', '! ').replace('?', '? ')
        # Then remove other punctuation and convert to lowercase
        text = text.translate(str.maketrans('', '', string.punctuation)).lower()
        
        # Initialize Rake with optimized parameters and custom stop words
        r = Rake(
            min_length=1,  # Allow single word keywords
            max_length=2,  # Maximum 2 words per keyword
            ranking_metric=Metric.DEGREE_TO_FREQUENCY_RATIO,  # Best metric for keyword relevance
            include_repeated_phrases=False,  # Avoid duplicate phrases
            stopwords=custom_stopwords  # Use custom stop words
        )
        
        r.extract_keywords_from_text(text)
        # Get all keywords with scores and take top 10
        keywords = r.get_ranked_phrases_with_scores()[:10]
        
        # Filter out verbs and adverbs from keywords
        filtered_keywords = []
        for score, phrase in keywords:
            tokens = nltk.word_tokenize(phrase)
            pos_tags = nltk.pos_tag(tokens)
            # Check if any token is a verb (VB, VBD, VBN) or adverb (RB, RBR, RBS)
            if not any(tag.startswith('VB') or tag.startswith('RB') for _, tag in pos_tags):
                # Only append if the phrase is not empty or just whitespace
                cleaned_phrase = phrase.strip()
                if cleaned_phrase:  # Ensure it's not empty
                    filtered_keywords.append({
                        "score": round(score, 10),  # Round score to 10 decimal places
                        "keyword": cleaned_phrase  # Clean up any extra whitespace
                    })
        
        logging.debug(f"Extracted keywords (without verbs and adverbs): {filtered_keywords}")
        return jsonify(filtered_keywords)
        
    except Exception as e:
        logging.exception("An error occurred while extracting keywords")
        return jsonify({"error": "An internal error occurred"}), 500

if __name__ == '__main__':
    app.run(port=5001)
