import Papa from 'papaparse';
import { Celebrity } from '../types/Celebrity';

// Helper function to safely parse the Also Viewed array
const parseAlsoViewed = (alsoViewedStr: string): string[] => {
  try {
    // Remove the square brackets and split by comma
    const cleaned = alsoViewedStr.replace(/[\[\]']/g, '').split(',');
    // Clean up each name and filter out empty strings
    return cleaned
      .map(name => name.trim())
      .filter(name => name.length > 0);
  } catch (error) {
    console.warn('Failed to parse Also Viewed:', alsoViewedStr);
    return [];
  }
};

// This would be replaced with an actual API call in production
export const loadCelebrityData = async (): Promise<Celebrity[]> => {
  try {
    console.log('Attempting to fetch celebrity data...');
    // Try a few different possible locations for the CSV file
    const possiblePaths = [
      '/celeb_data.csv',           // Root path
      './celeb_data.csv',          // Relative path
      '/public/celeb_data.csv',    // Public directory
      '../celeb_data.csv',         // One level up
    ];
    
    let response: Response | null = null;
    let successPath = '';
    
    // Try each path until we find one that works
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to fetch from: ${path}`);
        const resp = await fetch(path);
        if (resp.ok) {
          response = resp;
          successPath = path;
          break;
        }
      } catch (err) {
        console.warn(`Failed to fetch from ${path}`);
      }
    }
    
    // If none of the paths worked, try loading the static version
    if (!response) {
      console.warn('Could not fetch CSV dynamically, falling back to static import');
      
      try {
        const staticData = require('../../../celeb_data.csv'); // For webpack
        console.log('Loaded static data:', staticData);
        
        // Process the static data
        // This is a simplified fallback and might not work depending on your setup
        return [];
      } catch (staticErr) {
        console.error('Failed to load static data:', staticErr);
        return [];
      }
    }
    
    if (!response) {
      console.error('Failed to fetch CSV from any location');
      return [];
    }
    
    console.log(`CSV fetched successfully from ${successPath}, parsing...`);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          console.log(`Parsed ${results.data.length} rows from CSV`);
          const celebrities: Celebrity[] = results.data
            .filter((row: any) => row.Name) // Filter out empty rows
            .map((row: any, index) => {
              try {
                return {
                  id: index,
                  name: row.Name || '',
                  birthday: row.Birthday || '',
                  age: parseInt(row.Age, 10) || 0,
                  occupation: row.Occupation || '',
                  bio: row.Bio || '',
                  alsoViewed: parseAlsoViewed(row['Also Viewed'] || '[]')
                };
              } catch (error) {
                console.error('Error parsing row:', row, error);
                return null;
              }
            })
            .filter((celebrity): celebrity is Celebrity => celebrity !== null);
            
          console.log('Celebrity data processed successfully');
          resolve(celebrities);
        },
        error: (error: Error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading celebrity data:', error);
    return [];
  }
}; 