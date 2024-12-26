from flask import Flask, request, jsonify
from flask_cors import CORS
import yake
import re

app = Flask(__name__)
CORS(app)

def clean_text(text):
    # Remove contractions from being considered as separate keywords
    text = re.sub(r"'re\s", " are ", text)
    text = re.sub(r"'s\s", " is ", text)
    text = re.sub(r"'m\s", " am ", text)
    text = re.sub(r"'ll\s", " will ", text)
    text = re.sub(r"n't\s", " not ", text)
    return text

def extract_keywords(text, max_ngram_size=3, num_keywords=12):
    # Clean the text first
    cleaned_text = clean_text(text)
    
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
    
    keywords = kw_extractor.extract_keywords(cleaned_text)
    sorted_keywords = sorted(keywords, key=lambda x: x[1])
    
    # Filter out invalid keywords
    valid_keywords = [
        {"keyword": kw, "score": score}
        for kw, score in sorted_keywords
        if len(kw.split()) <= max_ngram_size and "'" not in kw
    ]
    
    return valid_keywords[:num_keywords]

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