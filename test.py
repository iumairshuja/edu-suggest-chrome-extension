import requests

def test_api():
    # Replace with your actual Vercel URL
    url = "https://yake-keyword-extractor.vercel.app/extract_keywords"
    
    # Test text
    text = "The Big Bang Theory is the leading explanation for how the universe began. Simply put, it says the universe as we know it started with an infinitely hot and dense single point."
    
    # Make request
    try:
        response = requests.post(
            url,
            json={"text": text}
        )
        
        if response.status_code == 200:
            print("Success!")
            print("\nExtracted Keywords:")
            for item in response.json():
                print(f"Keyword: {item['keyword']:<30} Score: {item['score']:.4f}")
        else:
            print(f"Error: Status code {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_api()