import newspaper
from newspaper import Article
from newspaper import news_pool
import pandas as pd
import random

# List of common user agents
user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
]

print("Starting script...")

# Configure newspaper with user agent
config = newspaper.Config()
config.browser_user_agent = random.choice(user_agents)
config.request_timeout = 10
config.fetch_images = False

print(f"Building paper with user agent: {config.browser_user_agent}")
britannica = newspaper.build('https://coursera.org/articles', config=config, memoize_articles=False)

papers = [britannica]
print(f"Found {len(britannica.articles)} articles on britannica")

news_pool.set(papers, threads_per_source=4)
print("Starting news pool download...")
news_pool.join()
print("News pool download complete")

final_df = pd.DataFrame(columns=['URL', 'Title', 'Author', 'Full_text', 'Summary', 'Keywords', 'Date'])

limit = 5
success_count = 0
error_count = 0

for source in papers:
    count = 0
    print(f"\nProcessing source with {len(source.articles)} articles...")

    for article_extract in source.articles:
        if count >= limit:
            print(f"\nReached limit of {limit} articles. Stopping.")
            break
            
        try:
            print(f"\nProcessing article {count + 1}/{limit} - URL: {article_extract.url}")
            
            # Create new Article object with config
            article = Article(article_extract.url, config=config)
            article.download()
            
            article.parse()
            
            # Perform NLP for summary and keywords
            article.nlp()
            
            # Get authors as comma-separated string
            authors = ', '.join(article.authors) if article.authors else ''
            
            # Get keywords as comma-separated string
            keywords = ', '.join(article.keywords) if article.keywords else ''
            
            # Format date or use empty string if None
            pub_date = article.publish_date.strftime('%Y-%m-%d') if article.publish_date else ''

            # Create a row with all the requested fields
            article_data = {
                'URL': article.url,
                'Title': article.title,
                'Author': authors,
                'Full_text': article.text,
                'Summary': article.summary,
                'Keywords': keywords,
                'Date': pub_date
            }
            
            # Append the row to the dataframe using pd.concat
            final_df = pd.concat([final_df, pd.DataFrame([article_data])], ignore_index=True)
            
            count += 1
            success_count += 1
            
            
        except Exception as e:
            error_count += 1
            print(f"ERROR processing article {count + 1}:")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            print(f"URL: {article_extract.url}")
            continue

print(f"\nProcessing complete!")
print(f"Successful articles: {success_count}")
print(f"Failed articles: {error_count}")

print("\nExporting to Excel...")
# Export to Excel file
final_df.to_excel('britannica8888.xlsx', index=False)
print("Script complete!")