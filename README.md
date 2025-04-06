# DataHacks Frontend - Celebrity Analysis App

## Setup with Pre-processed Trends Data

This repository contains a React frontend application for analyzing celebrity data. Since the application will be deployed without a backend server, we've pre-processed the Google Trends data for celebrities and included it as a CSV file in the frontend.

### How to Pre-process Trends Data

1. Run the Python script to generate the trends data CSV:
   ```bash
   python generate_trends_data.py
   ```

2. The script will create a file called `celebrity_trends.csv` which contains the name of each celebrity and their trend data in JSON format.

3. Copy this file to the frontend's data directory:
   ```bash
   cp celebrity_trends.csv frontend/src/data/
   ```

4. **Important:** Also copy both CSV files to the public directory so they can be loaded at runtime:
   ```bash
   cp celebrity_trends.csv frontend/public/
   cp celeb_data.csv frontend/public/
   ```

### How it Works

Instead of making API calls to a backend server, the TrendGraph component now:

1. Loads the pre-processed CSV file once when the app starts
2. Creates an in-memory cache of all celebrity trend data
3. Retrieves data from this cache when a celebrity is selected

The component also now displays the popularity threshold as a horizontal line on the graph, making it easier to see which time periods had popularity above the threshold.

### Dependencies

For the data preprocessing script:
- pandas
- tqdm (for progress bars)
- serpapi (Google Trends API wrapper)

For the frontend:
- React
- Material UI
- D3.js
- Papa Parse (for CSV parsing)

### Development

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the app:
   ```bash
   npm start
   ```

### Troubleshooting

If you encounter the error "Failed to load celebrity data", make sure:
1. The `celeb_data.csv` file is in the `frontend/public/` directory
2. The `celebrity_trends.csv` file is in both `frontend/src/data/` and `frontend/public/` directories

If you see JSON parsing errors like `SyntaxError: Unexpected non-whitespace character after JSON at position X`, try:
1. Regenerate the CSV file with the updated script that properly quotes all fields: `python generate_trends_data.py`
2. Make sure to copy the newly generated file to both locations
3. If errors persist, manually edit the CSV file to ensure JSON strings are properly escaped

### Notes

- The CSV files need to be in the public directory to be accessible at runtime
- Fallback sample data is provided if a celebrity doesn't have trend data
- The updated trendsService.ts file uses more robust CSV parsing with PapaParse