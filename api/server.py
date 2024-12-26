from flask import Flask, request, jsonify
from flask_cors import CORS
import yake

app = Flask(__name__)
CORS(app)

def extract_keywords(text, max_ngram_size=3, num_keywords=10):
    """
    Extract keywords from text using YAKE
    """
    language = "en"
    deduplication_threshold = 0.9
    deduplication_algo = 'seqm'
    windowSize = 1
    
    kw_extractor = yake.KeywordExtractor(
        lan=language, 
        n=max_ngram_size,
        dedupLim=deduplication_threshold,
        dedupFunc=deduplication_algo,
        windowsSize=windowSize,
        top=num_keywords,
        features=None
    )
    
    # Extract and sort keywords
    keywords = kw_extractor.extract_keywords(text)
    sorted_keywords = sorted(keywords, key=lambda x: x[1])
    
    # Convert to list of dictionaries
    return [{"keyword": kw, "score": score} for kw, score in sorted_keywords[:num_keywords]]

@app.route('/extract_keywords', methods=['POST'])
def keyword_extraction():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        keywords = extract_keywords(text)
        return jsonify(keywords)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    return "YAKE Keyword Extraction API is running!"
