from keybert import KeyBERT
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk import pos_tag

# Download NLTK resources
nltk.download("stopwords")
nltk.download("averaged_perceptron_tagger_eng")

# Initialize KeyBERT
kw_model = KeyBERT()

# Stop words
stop_words = set(stopwords.words("english"))

# Preprocessing function
def preprocess_text(text):
    sentences = sent_tokenize(text)
    clean_sentences = []
    for sentence in sentences:
        # Remove unwanted punctuation and extra spaces
        sentence = re.sub(r"[^\w\s.]", "", sentence)  # Keep full stops
        sentence = re.sub(r"\s+", " ", sentence).strip()
        clean_sentences.append(sentence)
    return " ".join(clean_sentences)

# POS-based filtering function
def filter_keywords(keywords):
    filtered_keywords = []
    for kw, score in keywords:
        # Tokenize and POS-tag the keyword
        tokens = word_tokenize(kw)
        pos_tags = pos_tag(tokens)

        # Check if all words are nouns (NN) or proper nouns (NNP)
        if all(tag.startswith("NN") for _, tag in pos_tags):
            filtered_keywords.append((kw, score))
    return filtered_keywords

# Keyword extraction function
def extract_keywords(text, top_n=10):
    # Preprocess the text
    cleaned_text = preprocess_text(text)

    # Extract raw keywords with KeyBERT
    raw_keywords = kw_model.extract_keywords(
        cleaned_text,
        keyphrase_ngram_range=(1, 3),  # Single words to trigrams
        stop_words="english",
        use_maxsum=True,
        nr_candidates=20
    )

    # Filter keywords based on POS tags
    filtered_keywords = filter_keywords(raw_keywords)

    # Return top N filtered keywords
    return filtered_keywords[:top_n]

# Example text
text = """
Home renovations can be exciting, but they're anxious with potential pitfalls that can turn your dream project into a costly nightmare. Imagine you have spent months scrolling through Pinterest, collecting design ideas, and dreaming about your perfect home transformation. Suddenly, your renovation turns into a nightmare that makes you want to pull your hair out. 
Trust me, I have seen it happen more times than I can count.
"""

# Extract and print keywords
keywords = extract_keywords(text, top_n=10)
print("Extracted Keywords:")
for kw, score in keywords:
    print(f"  {kw}: {score:.4f}")
