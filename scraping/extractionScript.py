from newspaper import Article, Config  # Add Config import
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
import random  # Add random import

# Define user agents
user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
]

def read_urls_from_file(file_path):
    with open(file_path, 'r') as f:
        urls = f.readlines()
    return [url.strip() for url in urls]  

def scrape_article(url):
    try:
        # Configure newspaper
        config = Config()
        config.browser_user_agent = random.choice(user_agents)
        config.request_timeout = 10
        config.fetch_images = False

        # Initialize Article with config
        article = Article(url, config=config)
        article.download()
        article.parse()
        article.nlp()

        return {
            "URL": url,
            "Title": article.title,
            "Author": ", ".join(article.authors) if article.authors else "Unknown",
            "Content": article.text,
            "Summary": article.summary,
            "Keywords": ", ".join(article.keywords),
            "Date": article.publish_date.strftime("%Y-%m-%d") if article.publish_date else "Unknown"
        }
    except Exception as e:
        print(f"Error processing {url}: {e}")
        return None

# Read URLs from the file
file_path = 'scraping/urls.txt'  # Path to your URLs file
urls = read_urls_from_file(file_path)

# Use ThreadPoolExecutor for multithreading
with ThreadPoolExecutor(max_workers=7) as executor:
    results = executor.map(scrape_article, urls)

# Filter out None results and create a DataFrame
data = [result for result in results if result]
df = pd.DataFrame(data)

# Save to Excel
output_file = "simpliLearn.xlsx"
df.to_excel(output_file, index=False)

print(f"Data saved to {output_file}")
