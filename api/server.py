from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS for handling cross-origin requests
import yake

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def extract_keywords(text, max_ngram_size=3, num_keywords=10):
    """
    Extract keywords from text using YAKE
    """
    # Configure the keyword extractor
    language = "en"
    deduplication_threshold = 0.9
    deduplication_algo = 'seqm'
    windowSize = 1
    
    # Initialize the YAKE keyword extractor
    kw_extractor = yake.KeywordExtractor(
        lan=language, 
        n=max_ngram_size,
        dedupLim=deduplication_threshold,
        dedupFunc=deduplication_algo,
        windowsSize=windowSize,
        top=num_keywords * 2,
        features=None
    )
    
    # Extract keywords
    keywords = kw_extractor.extract_keywords(text)
    
    # Sort keywords by score and filter redundant words
    sorted_keywords = sorted(keywords, key=lambda x: x[1])
    words_in_phrases = set()
    filtered_keywords = []
    
    for keyword, score in sorted_keywords:
        words = keyword.lower().split()
        if len(words) > 1:
            words_in_phrases.update(words)
            filtered_keywords.append({"keyword": keyword, "score": score})
        elif len(words) == 1 and words[0] not in words_in_phrases:
            filtered_keywords.append({"keyword": keyword, "score": score})
            words_in_phrases.add(words[0])
            
    return filtered_keywords[:num_keywords]

@app.route('/extract_keywords', methods=['POST'])
def keyword_extraction():
    try:
        # Get the JSON data from the request
        data = request.get_json()
        
        # Check if text is provided in the request
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        # Extract keywords from the text
        text = data['text']
        keywords = extract_keywords(text)
        
        # Return the keywords as JSON
        return jsonify(keywords)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)