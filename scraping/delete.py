def is_article_url(url):
    url = url.strip()
    # Case 1: Direct medium.com article URLs (no username)
    if url.startswith('https://medium.com/') and not '@' in url:
        parts = url.split('medium.com/')
        path_segments = parts[1].split('/')
        return len(path_segments) > 1 and len(path_segments[1]) > 0
    
    # Case 2: URLs with username
    parts = url.split('@')
    if len(parts) == 2:
        username_and_path = parts[1].split('/')
        return len(username_and_path) > 1
    
    # Case 3: Filter out URLs starting with 'https://miro.medium.com'
    if url.startswith('https://miro.medium.com'):
        return False
    
    return False

def clean_url(url):
    # Remove extra text after and including '?'
    return url.split('?')[0]

def filter_medium_urls(input_file):
    try:
        # Read all URLs from input file
        with open(input_file, 'r', encoding='utf-8') as f:
            urls = f.readlines()
        
        # Clean URLs and filter only article URLs
        cleaned_urls = [clean_url(url.strip()) for url in urls]
        article_urls = [url for url in cleaned_urls if is_article_url(url)]
        
        # Write filtered URLs back to the same file
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(article_urls))
            
        print(f"Successfully filtered URLs. Removed {len(urls) - len(article_urls)} invalid URLs.")
        
    except FileNotFoundError:
        print(f"Error: Could not find file {input_file}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

# Execute the filtering
input_file = 'mediumTechRecommended.txt'
filter_medium_urls(input_file)
