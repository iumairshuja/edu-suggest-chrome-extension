import pandas as pd
import sys

import xml.etree.ElementTree as ET

def xml_to_dataframe(xml_file):
    try:
        # Parse XML file
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        # Create lists to store data
        all_records = []
        
        # Extract all unique tags from XML
        for child in root.iter():
            record = {}
            for elem in child:
                record[elem.tag] = elem.text
            if record:  # Only add non-empty dictionaries
                all_records.append(record)
        
        # Convert to DataFrame
        df = pd.DataFrame(all_records)
        return df
    
    except Exception as e:
        print(f"Error processing XML file: {str(e)}")
        return None

def save_to_csv(df, output_file):
    try:
        df.to_csv(output_file, index=False)
        print(f"Successfully saved to CSV: {output_file}")
    except Exception as e:
        print(f"Error saving to CSV: {str(e)}")

def save_to_excel(df, output_file):
    try:
        df.to_excel(output_file, index=False)
        print(f"Successfully saved to Excel: {output_file}")
    except Exception as e:
        print(f"Error saving to Excel: {str(e)}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python xmltocsv.py <input_xml_file> [csv|excel]")
        return

    xml_file = sys.argv[1]
    output_format = sys.argv[2].lower() if len(sys.argv) > 2 else 'csv'
    
    # Convert XML to DataFrame
    df = xml_to_dataframe(xml_file)
    
    if df is not None:
        # Generate output filename
        output_file = xml_file.rsplit('.', 1)[0]
        
        # Save in requested format
        if output_format == 'excel':
            save_to_excel(df, output_file + '.xlsx')
        else:
            save_to_csv(df, output_file + '.csv')

if __name__ == "__main__":
    main()