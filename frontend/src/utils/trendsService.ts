import { DataPoint } from '../types/DataPoint';

// In-memory cache for celebrity trends data
let trendsCache: Map<string, DataPoint[]> | null = null;

// Flag to ensure we only use local CSV data (for serverless mode)
const USE_LOCAL_DATA_ONLY = true;

// Function to initialize the trends cache
const initializeTrendsCache = async (): Promise<void> => {
  if (trendsCache) return; // Already initialized
  
  console.log('Initializing trends data cache');
  trendsCache = new Map<string, DataPoint[]>();
  
  try {
    // Try multiple possible locations for the CSV file
    const possiblePaths = [
      '/celebrity_trends.csv',           // Public directory
      './celebrity_trends.csv',          // Relative path
      '../data/celebrity_trends.csv',    // Data directory
      '../../data/celebrity_trends.csv', // Up two levels
    ];
    
    let response: Response | null = null;
    let successPath = '';
    
    // Try each path until we find one that works
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to fetch trends data from: ${path}`);
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
    
    if (!response) {
      console.error('Failed to load trends data from any location');
      return;
    }
    
    console.log(`Found trends data at ${successPath}`);
    const csvText = await response.text();
    
    // Use PapaParse for robust CSV parsing
    try {
      // Import PapaParse dynamically
      const Papa = await import('papaparse').then(module => module.default);
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          console.log(`Parsed ${results.data.length} rows from the trends CSV`);
          
          let processedCount = 0;
          let errorCount = 0;
          
          results.data.forEach((row: any) => {
            if (!row.name || !row.trends_data) return;
            
            try {
              // Clean the name (remove quotes if present)
              const cleanName = row.name.replace(/^"|"$/g, '').trim();
              
              // The trends_data is a JSON string that could have nested quotes
              // First, ensure it's a clean string by removing any wrapping quotes
              let jsonString = row.trends_data.trim();
              
              // Remove starting and ending quotes if they exist
              if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
                jsonString = jsonString.slice(1, -1);
              }
              
              // Replace escaped quotes with actual quotes
              jsonString = jsonString.replace(/\\"/g, '"');
              
              // Also replace double double quotes with single double quotes (CSV escaping)
              jsonString = jsonString.replace(/""/g, '"');
              
              // Try parsing the JSON
              try {
                const trendsData = JSON.parse(jsonString);
                trendsCache?.set(cleanName, trendsData);
                processedCount++;
                console.log(`Loaded trends data for "${cleanName}" (${trendsData.length} points)`);
              } catch (parseError) {
                // If that fails, try an alternative approach
                console.warn(`Error parsing trends JSON for ${cleanName}:`, parseError);
                
                try {
                  // Try with a different regex approach
                  const fixedJson = jsonString
                    .replace(/(\{|,)\s*""/g, '$1"')
                    .replace(/"":/g, '":')
                    .replace(/"\{/g, '{')
                    .replace(/\}"/g, '}');
                  
                  const trendsData = JSON.parse(fixedJson);
                  trendsCache?.set(cleanName, trendsData);
                  processedCount++;
                  console.log(`Loaded trends data for "${cleanName}" with alternative parsing (${trendsData.length} points)`);
                } catch (altError) {
                  console.error(`All parsing attempts failed for ${cleanName}`);
                  trendsCache?.set(cleanName, []);
                  errorCount++;
                }
              }
            } catch (e) {
              console.error(`Error processing trends data for ${row.name}:`, e);
              errorCount++;
              // Still add an empty entry so we don't keep trying to parse this
              try {
                const cleanName = row.name.replace(/^"|"$/g, '').trim();
                trendsCache?.set(cleanName, []);
              } catch {
                // If even this fails, just skip this row
              }
            }
          });
          
          console.log(`Loaded trends data for ${processedCount} celebrities, errors: ${errorCount}`);
          console.log(`Celebrity names in cache: ${Array.from(trendsCache?.keys() || []).join(', ')}`);
        },
        error: (error: Error) => {
          console.error('Error parsing CSV with PapaParse:', error);
        }
      });
    } catch (papaError) {
      console.error('Error loading PapaParse:', papaError);
      
      // Fallback to manual parsing if PapaParse fails
      console.warn('Falling back to manual CSV parsing');
      
      // Parse CSV manually as a fallback
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      // Skip header row and process each data row
      let processedCount = 0;
      let errorCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        try {
          // This is a more robust way to handle CSV with quoted fields
          // First, get the name (should be the first field)
          const nameMatch = lines[i].match(/^"?([^",]+)"?,/);
          if (!nameMatch) continue;
          
          const name = nameMatch[1].trim();
          
          // Then get everything after the first comma as the JSON data
          const jsonPart = lines[i].substring(lines[i].indexOf(',', name.length) + 1).trim();
          
          // If it starts and ends with quotes, remove them
          let jsonString = jsonPart;
          if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
            jsonString = jsonString.slice(1, -1);
          }
          
          // Unescape double quotes within the JSON
          jsonString = jsonString.replace(/\\"/g, '"').replace(/""/g, '"');
          
          try {
            // Parse the JSON
            const trendsData = JSON.parse(jsonString);
            trendsCache?.set(name, trendsData);
            processedCount++;
            console.log(`Loaded trends data for "${name}" (manual parsing)`);
          } catch (parseError) {
            console.warn(`Error parsing trends JSON for ${name}:`, parseError);
            
            try {
              // Try with a different regex approach
              const fixedJson = jsonString
                .replace(/(\{|,)\s*""/g, '$1"')
                .replace(/"":/g, '":')
                .replace(/"\{/g, '{')
                .replace(/\}"/g, '}');
              
              const trendsData = JSON.parse(fixedJson);
              trendsCache?.set(name, trendsData);
              processedCount++;
              console.log(`Loaded trends data for "${name}" with alternative parsing (manual)`);
            } catch (altError) {
              console.error(`All parsing attempts failed for ${name}`);
              trendsCache?.set(name, []);
              errorCount++;
            }
          }
        } catch (e) {
          const celebName = lines[i].split(',')[0].replace(/"/g, '').trim();
          console.error(`Error parsing line ${i} for ${celebName}:`, e);
          errorCount++;
          if (celebName) {
            trendsCache?.set(celebName, []);
          }
        }
      }
      
      console.log(`Loaded trends data for ${processedCount} celebrities using manual parsing, errors: ${errorCount}`);
      console.log(`Celebrity names in cache: ${Array.from(trendsCache?.keys() || []).join(', ')}`);
    }
  } catch (error) {
    console.error('Error loading trends data CSV:', error);
  }
};

// Helper function to get the best matching name from the cache
const findBestMatch = (name: string): string | null => {
  if (!trendsCache) return null;
  
  console.log(`Looking for best match for "${name}" among ${trendsCache.size} celebrities`);
  
  // Normalize the search name - remove quotes, extra spaces, and lowercase
  const normalizedName = name.replace(/^"|"$/g, '').trim().toLowerCase();
  
  // First, try exact match (case insensitive)
  for (const cachedName of trendsCache.keys()) {
    if (cachedName.toLowerCase() === normalizedName) {
      console.log(`Found exact match: "${cachedName}" for "${name}"`);
      return cachedName;
    }
  }
  
  // Next, try special cases for first/last name reversals
  const nameParts = normalizedName.split(/\s+/);
  if (nameParts.length > 1) {
    // Try reversed name (last name, first name)
    const reversedName = [...nameParts].reverse().join(' ');
    for (const cachedName of trendsCache.keys()) {
      if (cachedName.toLowerCase() === reversedName) {
        console.log(`Found match with reversed name: "${cachedName}" for "${name}"`);
        return cachedName;
      }
    }
  }
  
  // Look for partial matches where all words in the search name are in the cached name
  for (const cachedName of trendsCache.keys()) {
    const cachedLower = cachedName.toLowerCase();
    // Check if all words in the search name are in the cached name
    if (nameParts.every(word => cachedLower.includes(word))) {
      console.log(`Found match by words: "${cachedName}" for "${name}"`);
      return cachedName;
    }
  }
  
  // Check for nickname variants
  const commonNicknames: Record<string, string[]> = {
    'william': ['will', 'bill', 'billy'],
    'robert': ['rob', 'bob', 'bobby'],
    'richard': ['rick', 'rich', 'dick'],
    'christopher': ['chris', 'topher'],
    'michael': ['mike', 'mick', 'mickey'],
    'james': ['jim', 'jimmy'],
    'joseph': ['joe', 'joey'],
    'elizabeth': ['liz', 'beth', 'eliza', 'betsy'],
    'katherine': ['kate', 'kathy', 'katie'],
    'jennifer': ['jen', 'jenny'],
    'samuel': ['sam', 'sammy'],
    'daniel': ['dan', 'danny'],
    'kenneth': ['ken', 'kenny'],
    'charles': ['charlie', 'chuck'],
    'thomas': ['tom', 'tommy'],
    'anthony': ['tony'],
    'edward': ['ed', 'eddie', 'ted'],
    'donald': ['don', 'donny'],
    'steven': ['steve'],
    'benjamin': ['ben', 'benji'],
    'kanye': ['ye'],
    'ye': ['kanye']
  };
  
  // Try matching with common nicknames
  if (nameParts.length > 0) {
    const firstName = nameParts[0];
    
    // Check if the first name has any known nicknames
    for (const [fullName, nicknames] of Object.entries(commonNicknames)) {
      // If first name matches a full name or nickname, look for matches with the alternative forms
      if (firstName === fullName || nicknames.includes(firstName)) {
        const alternativeNames = [fullName, ...nicknames];
        
        for (const alternative of alternativeNames) {
          if (alternative === firstName) continue; // Skip the form we already tried
          
          // Create variations with the alternative name
          const alternativeSearchName = [alternative, ...nameParts.slice(1)].join(' ');
          
          for (const cachedName of trendsCache.keys()) {
            if (cachedName.toLowerCase().includes(alternativeSearchName)) {
              console.log(`Found match using nickname: "${cachedName}" for "${name}" (tried "${alternativeSearchName}")`);
              return cachedName;
            }
          }
        }
      }
    }
  }
  
  // If still no match, try matching just the last name if it's a multi-word name
  if (nameParts.length > 1) {
    const lastName = nameParts[nameParts.length - 1];
    
    // Check if any celebrity name ends with this last name
    for (const cachedName of trendsCache.keys()) {
      const cachedParts = cachedName.toLowerCase().split(/\s+/);
      if (cachedParts.length > 0 && cachedParts[cachedParts.length - 1] === lastName) {
        console.log(`Found match by last name: "${cachedName}" for "${name}"`);
        return cachedName;
      }
    }
  }
  
  // If still no match, try first name match as fallback
  if (nameParts.length > 0) {
    const firstName = nameParts[0];
    for (const cachedName of trendsCache.keys()) {
      const cachedLower = cachedName.toLowerCase();
      if (cachedLower.startsWith(firstName + ' ')) {
        console.log(`Found match by first name: "${cachedName}" for "${name}"`);
        return cachedName;
      }
    }
  }
  
  console.log(`No match found for "${name}"`);
  return null;
};

// Function to fetch trends data for a specific celebrity
export const fetchTrendsData = async (name: string): Promise<DataPoint[]> => {
  // Initialize cache if needed
  if (!trendsCache) {
    await initializeTrendsCache();
  }
  
  // If we still don't have a cache (initialization failed), return empty array
  if (!trendsCache) {
    console.error('Trends data cache is not available');
    return [];
  }
  
  console.log(`Fetching trends data for ${name} from local cache`);
  
  // Try to find the best matching name in the cache
  const bestMatch = findBestMatch(name);
  
  if (bestMatch) {
    console.log(`Found matching trends data under name "${bestMatch}"`);
    const trendData = trendsCache.get(bestMatch) || [];
    
    if (trendData.length > 0) {
      // Log the actual format of the data to verify it's correct
      console.log(`First trend data point format:`, trendData[0]);
      console.log(`Total trend data points: ${trendData.length}`);
      
      // Ensure all data points have the correct format (x and y properties)
      const validData = trendData.filter(point => 
        typeof point === 'object' && 
        point !== null && 
        'x' in point && 
        'y' in point &&
        typeof point.x === 'number' && 
        typeof point.y === 'number'
      );
      
      if (validData.length !== trendData.length) {
        console.warn(`Found ${trendData.length - validData.length} invalid data points that don't match the DataPoint interface`);
      }
      
      return validData;
    } else {
      console.log(`No trend data points available for ${bestMatch}`);
      return [];
    }
  }
  
  // If we're in serverless mode, don't try API fallback
  if (USE_LOCAL_DATA_ONLY) {
    console.log(`No trends data found for ${name} in CSV (serverless mode - not attempting API fallback)`);
    return [];
  }
  
  console.log(`No trends data found for ${name}`);
  return [];
}; 