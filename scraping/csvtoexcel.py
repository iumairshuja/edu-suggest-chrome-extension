import pandas as pd
from datetime import datetime

# Read the CSV file
# Replace 'your_file.csv' with your actual CSV file name
df = pd.read_csv('/workspaces/edu-suggest-chrome-extension/coursera_3500toEOL.csv')

# Convert the date column (G1) to datetime and then format it
# Assuming your date column name is 'Date'. Replace it with your actual column name
df['Date'] = pd.to_datetime(df['Date'], format='%m/%d/%Y').dt.strftime('%Y-%m-%d')

# Save the result to an Excel file
# Replace 'output.xlsx' with your desired output file name
df.to_excel('coursera_3500toEOL.xlsx', index=False)

print("Conversion completed successfully!")