import pandas as pd
import yake
import numpy as np
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_keywords(text, max_ngram_size=3, num_keywords=10):
    """Extract keywords using YAKE directly"""
    try:
        # Configure YAKE
        kw_extractor = yake.KeywordExtractor(
            lan="en",
            n=max_ngram_size,
            dedupLim=0.9,
            dedupFunc='seqm',
            windowsSize=1,
            top=num_keywords * 2,
            features=None
        )
        
        # Extract keywords
        keywords = kw_extractor.extract_keywords(str(text))
        
        # Sort and filter keywords
        sorted_keywords = sorted(keywords, key=lambda x: x[1])
        words_in_phrases = set()
        filtered_keywords = []
        
        for keyword, score in sorted_keywords:
            words = keyword.lower().split()
            if len(words) > 1:
                words_in_phrases.update(words)
                filtered_keywords.append(keyword)
            elif len(words) == 1 and words[0] not in words_in_phrases:
                filtered_keywords.append(keyword)
                words_in_phrases.add(words[0])
                
        return ", ".join(filtered_keywords[:num_keywords])
    except Exception as e:
        return f"Error: {str(e)}"

def process_batch(batch_with_indices):
    """Process a batch of texts in parallel, maintaining index information"""
    indices, texts = zip(*batch_with_indices)
    results = [get_keywords(text) if pd.notna(text) and str(text).strip() else '' for text in texts]
    return list(zip(indices, results))

def verify_processing(df, num_samples=5):
    """Verify the keyword extraction results"""
    print("\nVerifying keyword extraction for sample rows:")
    print("-" * 80)
    
    # Get random sample indices, but always include the first row
    sample_indices = [0]  # Always include first row
    if len(df) > 1:
        remaining_samples = min(num_samples - 1, len(df) - 1)
        if remaining_samples > 0:
            sample_indices.extend(np.random.choice(
                range(1, len(df)), 
                size=remaining_samples, 
                replace=False
            ))
    
    for idx in sorted(sample_indices):
        print(f"\nRow {idx + 1}:")
        print("Content:")
        content = str(df.iloc[idx]['Content'])
        print(content[:200] + "..." if len(content) > 200 else content)
        print("\nExtracted Keywords:")
        print(df.iloc[idx]['New Keywords'])
        print("-" * 80)

def process_excel_file(file_path, batch_size=10, max_workers=4):
    """Process Excel file with parallel batch processing"""
    try:
        # Read the Excel file
        print("Reading Excel file...")
        df = pd.read_excel(file_path)
        
        # Initialize new keywords column
        if 'New Keywords' not in df.columns:
            df['New Keywords'] = ''
        
        # Create list of tuples with index and content
        contents_with_indices = list(enumerate(df['Content']))
        total_batches = (len(contents_with_indices) + batch_size - 1) // batch_size
        
        print(f"Processing {len(contents_with_indices)} entries in {total_batches} batches...")
        
        # Process batches in parallel
        results_dict = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            
            # Submit batches to thread pool
            for i in range(0, len(contents_with_indices), batch_size):
                batch = contents_with_indices[i:i + batch_size]
                futures.append(executor.submit(process_batch, batch))
            
            # Process results as they complete
            for future in tqdm(as_completed(futures), total=len(futures)):
                batch_results = future.result()
                for idx, keywords in batch_results:
                    results_dict[idx] = keywords
        
        # Update DataFrame with results in correct order
        for idx in range(len(df)):
            if idx in results_dict:
                df.at[idx, 'New Keywords'] = results_dict[idx]
        
        # Verify processing
        verify_processing(df)
        
        # Save results
        print("\nSaving results...")
        df.to_excel(file_path, index=False)
        print(f"Processing complete! Results saved to {file_path}")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        raise e

if __name__ == "__main__":
    excel_file = "/workspaces/edu-suggest-chrome-extension/scraping/edutopia/edutopia_0to500.xlsx"
    process_excel_file(excel_file, batch_size=10, max_workers=4)