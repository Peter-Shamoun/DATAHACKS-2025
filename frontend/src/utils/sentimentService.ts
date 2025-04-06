import { DataPoint } from '../types/DataPoint';

// Extended interface to include title and link information
export interface SentimentDataPoint extends DataPoint {
  title?: string;
  link?: string;
  extremeScore?: number; // Most extreme sentiment score
}

// Interface for extreme sentiment items
export interface ExtremeSentimentItem {
  year: number;
  title: string;
  score: number;
  link?: string;
}

// Interface for the sentiment grade
export interface SentimentGrade {
  letter: string;
  score: number; // Numeric score from 0-100
  description: string;
}

// In-memory cache for celebrity sentiment data
let sentimentCache: Map<string, SentimentDataPoint[]> | null = null;

// Flag to ensure we only use local CSV data (for serverless mode)
const USE_LOCAL_DATA_ONLY = true;

// Function to initialize the sentiment cache
const initializeSentimentCache = async (): Promise<void> => {
  if (sentimentCache) return; // Already initialized
  
  console.log('Initializing sentiment data cache');
  sentimentCache = new Map<string, SentimentDataPoint[]>();
  
  try {
    // Try multiple possible locations for the CSV file
    const possiblePaths = [
      '/search/celebrity_sentiment_analysis.csv',   // Public directory
      './search/celebrity_sentiment_analysis.csv',  // Relative path
      '../search/celebrity_sentiment_analysis.csv', // Up one level
      '../../search/celebrity_sentiment_analysis.csv', // Up two levels
    ];
    
    let response: Response | null = null;
    let successPath = '';
    
    // Try each path until we find one that works
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to fetch sentiment data from: ${path}`);
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
      console.error('Failed to load sentiment data from any location');
      return;
    }
    
    console.log(`Found sentiment data at ${successPath}`);
    const csvText = await response.text();
    
    // Use PapaParse for robust CSV parsing
    try {
      // Import PapaParse dynamically
      const Papa = await import('papaparse').then(module => module.default);
      
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          console.log(`Parsed ${results.data.length} rows from the sentiment CSV`);
          
          let processedCount = 0;
          let errorCount = 0;
          
          // Group data by celebrity name
          const groupedData: Map<string, SentimentDataPoint[]> = new Map();
          
          results.data.forEach((row: any) => {
            if (!row.name || !row.year || row.average_sentiment === undefined) return;
            
            try {
              const name = row.name.trim();
              const year = parseInt(row.year, 10);
              // Scale sentiment from -1,1 to -10,10 range
              const sentiment = parseFloat(row.average_sentiment) * 10;
              const title = row.most_extreme_title?.trim() || '';
              const link = row.most_extreme_link?.trim() || '';
              const extremeScore = row.most_extreme_sentiment ? parseFloat(row.most_extreme_sentiment) : undefined;
              
              if (isNaN(year) || isNaN(sentiment)) {
                console.warn(`Invalid data for ${name}: year=${row.year}, sentiment=${row.average_sentiment}`);
                return;
              }
              
              // Create or update the array for this celebrity
              if (!groupedData.has(name)) {
                groupedData.set(name, []);
              }
              
              groupedData.get(name)?.push({ 
                x: year, 
                y: sentiment,
                title: title,
                link: link,
                extremeScore: extremeScore
              });
              processedCount++;
            } catch (e) {
              console.error(`Error processing sentiment data:`, e);
              errorCount++;
            }
          });
          
          // Sort each celebrity's data points by year
          groupedData.forEach((dataPoints, name) => {
            dataPoints.sort((a, b) => a.x - b.x);
            sentimentCache?.set(name, dataPoints);
            console.log(`Loaded ${dataPoints.length} sentiment points for "${name}"`);
          });
          
          console.log(`Loaded sentiment data for ${groupedData.size} celebrities, processed ${processedCount} data points, errors: ${errorCount}`);
          console.log(`Celebrity names in sentiment cache: ${Array.from(sentimentCache?.keys() || []).join(', ')}`);
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
      
      // Find column indices
      const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
      const yearIndex = headers.findIndex(h => h.toLowerCase() === 'year');
      const sentimentIndex = headers.findIndex(h => h.toLowerCase() === 'average_sentiment');
      const titleIndex = headers.findIndex(h => h.toLowerCase() === 'most_extreme_title');
      const linkIndex = headers.findIndex(h => h.toLowerCase() === 'most_extreme_link');
      const extremeScoreIndex = headers.findIndex(h => h.toLowerCase() === 'most_extreme_sentiment');
      
      if (nameIndex === -1 || yearIndex === -1 || sentimentIndex === -1) {
        console.error('Required columns not found in CSV');
        return;
      }
      
      // Group data by celebrity name
      const groupedData: Map<string, SentimentDataPoint[]> = new Map();
      
      // Skip header row and process each data row
      let processedCount = 0;
      let errorCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        try {
          const values = line.split(',');
          const name = values[nameIndex].replace(/^"|"$/g, '').trim();
          const year = parseInt(values[yearIndex], 10);
          // Scale sentiment from -1,1 to -10,10 range
          const sentiment = parseFloat(values[sentimentIndex]) * 10;
          const title = titleIndex >= 0 && values[titleIndex] ? values[titleIndex].replace(/^"|"$/g, '').trim() : '';
          const link = linkIndex >= 0 && values[linkIndex] ? values[linkIndex].replace(/^"|"$/g, '').trim() : '';
          const extremeScore = extremeScoreIndex >= 0 && values[extremeScoreIndex] 
            ? parseFloat(values[extremeScoreIndex])
            : undefined;
          
          if (!name || isNaN(year) || isNaN(sentiment)) {
            continue;
          }
          
          // Create or update the array for this celebrity
          if (!groupedData.has(name)) {
            groupedData.set(name, []);
          }
          
          groupedData.get(name)?.push({ 
            x: year, 
            y: sentiment,
            title: title,
            link: link,
            extremeScore: extremeScore 
          });
          processedCount++;
        } catch (e) {
          console.error(`Error parsing line ${i}:`, e);
          errorCount++;
        }
      }
      
      // Sort each celebrity's data points by year and store in cache
      groupedData.forEach((dataPoints, name) => {
        dataPoints.sort((a, b) => a.x - b.x);
        sentimentCache?.set(name, dataPoints);
      });
      
      console.log(`Loaded sentiment data for ${groupedData.size} celebrities using manual parsing, processed ${processedCount} data points, errors: ${errorCount}`);
    }
  } catch (error) {
    console.error('Error loading sentiment data CSV:', error);
  }
};

// Helper function to get the best matching name from the cache
const findBestMatch = (name: string): string | null => {
  if (!sentimentCache) return null;
  
  console.log(`Looking for best sentiment match for "${name}" among ${sentimentCache.size} celebrities`);
  
  // Normalize the search name - remove quotes, extra spaces, and lowercase
  const normalizedName = name.replace(/^"|"$/g, '').trim().toLowerCase();
  
  // First, try exact match (case insensitive)
  for (const cachedName of sentimentCache.keys()) {
    if (cachedName.toLowerCase() === normalizedName) {
      console.log(`Found exact sentiment match: "${cachedName}" for "${name}"`);
      return cachedName;
    }
  }
  
  // Next, try special cases for first/last name reversals
  const nameParts = normalizedName.split(/\s+/);
  if (nameParts.length > 1) {
    // Try reversed name (last name, first name)
    const reversedName = [...nameParts].reverse().join(' ');
    for (const cachedName of sentimentCache.keys()) {
      if (cachedName.toLowerCase() === reversedName) {
        console.log(`Found sentiment match with reversed name: "${cachedName}" for "${name}"`);
        return cachedName;
      }
    }
  }
  
  // Look for partial matches where all words in the search name are in the cached name
  for (const cachedName of sentimentCache.keys()) {
    const cachedLower = cachedName.toLowerCase();
    // Check if all words in the search name are in the cached name
    if (nameParts.every(word => cachedLower.includes(word))) {
      console.log(`Found partial sentiment match: "${cachedName}" for "${name}"`);
      return cachedName;
    }
  }
  
  console.log(`No sentiment match found for "${name}"`);
  return null;
};

// Function to fetch sentiment data for a specific celebrity
export const fetchSentimentData = async (name: string): Promise<SentimentDataPoint[]> => {
  // Initialize cache if needed
  if (!sentimentCache) {
    await initializeSentimentCache();
  }
  
  // If we still don't have a cache (initialization failed), return empty array
  if (!sentimentCache) {
    console.error('Sentiment data cache is not available');
    return [];
  }
  
  console.log(`Fetching sentiment data for ${name} from local cache`);
  
  // Try to find the best matching name in the cache
  const bestMatch = findBestMatch(name);
  
  if (bestMatch) {
    console.log(`Found matching sentiment data under name "${bestMatch}"`);
    const sentimentData = sentimentCache.get(bestMatch) || [];
    
    if (sentimentData.length > 0) {
      // Log the actual format of the data to verify it's correct
      console.log(`First sentiment data point format:`, sentimentData[0]);
      console.log(`Total sentiment data points: ${sentimentData.length}`);
      
      // Ensure all data points have the correct format (x and y properties)
      const validData = sentimentData.filter(point => 
        typeof point === 'object' && 
        point !== null && 
        'x' in point && 
        'y' in point &&
        typeof point.x === 'number' && 
        typeof point.y === 'number'
      );
      
      if (validData.length !== sentimentData.length) {
        console.warn(`Found ${sentimentData.length - validData.length} invalid data points that don't match the DataPoint interface`);
      }
      
      return validData;
    } else {
      console.log(`No sentiment data points available for ${bestMatch}`);
      return [];
    }
  }
  
  console.log(`No sentiment data found for ${name}`);
  return [];
};

// Function to get the top extreme sentiment titles for a celebrity
export const getExtremeSentimentTitles = async (name: string, count: number = 3): Promise<ExtremeSentimentItem[]> => {
  // Initialize cache if needed
  if (!sentimentCache) {
    await initializeSentimentCache();
  }
  
  // If we still don't have a cache (initialization failed), return empty array
  if (!sentimentCache) {
    console.error('Sentiment data cache is not available');
    return [];
  }
  
  console.log(`Fetching extreme sentiment titles for ${name} from local cache`);
  
  // Try to find the best matching name in the cache
  const bestMatch = findBestMatch(name);
  
  if (!bestMatch) {
    console.log(`No sentiment data found for ${name}`);
    return [];
  }
  
  const sentimentData = sentimentCache.get(bestMatch) || [];
  
  if (sentimentData.length === 0) {
    console.log(`No sentiment data points available for ${bestMatch}`);
    return [];
  }
  
  // Filter only data points with a title and extreme score
  const validData = sentimentData.filter(point => 
    point.title && 
    point.extremeScore !== undefined && 
    !isNaN(point.extremeScore)
  );
  
  if (validData.length === 0) {
    console.log(`No valid extreme sentiment data found for ${bestMatch}`);
    return [];
  }
  
  // Sort by extremeness (absolute value of the score, closest to -1 or 1)
  // We take the absolute value, then subtract from 1 to get distance from extremes
  // The smaller the distance, the more extreme
  const sortedData = [...validData].sort((a, b) => {
    const distanceA = Math.abs(Math.abs(a.extremeScore!) - 1);
    const distanceB = Math.abs(Math.abs(b.extremeScore!) - 1);
    return distanceA - distanceB;
  });
  
  // Take top N most extreme
  const topExtremes = sortedData.slice(0, count);
  
  // Format the result
  return topExtremes.map(item => ({
    year: item.x,
    title: item.title!,
    score: item.extremeScore!,
    link: item.link
  }));
};

/**
 * Calculate a public sentiment grade for a celebrity based on their sentiment data
 * 
 * The algorithm calculates a grade based on several factors:
 * 1. Recent sentiment (last 3 years) weighted more heavily than older sentiment
 * 2. Overall average sentiment across all available years
 * 3. Trend direction (improving or declining public perception)
 * 4. Volatility of sentiment (dramatic changes vs. stable public opinion)
 * 5. Extremeness of sentiment (how polarizing the celebrity is)
 * 
 * Returns a grade object with letter, score, and detailed description
 */
export const calculatePublicSentimentGrade = async (name: string): Promise<SentimentGrade> => {
  // Initialize cache if needed
  if (!sentimentCache) {
    await initializeSentimentCache();
  }
  
  // Default grade if no data available
  const defaultGrade: SentimentGrade = {
    letter: 'C',
    score: 70,
    description: 'Average public sentiment rating based on limited data.'
  };
  
  // If cache initialization failed, return default grade
  if (!sentimentCache) {
    console.error('Sentiment data cache is not available for grading');
    return defaultGrade;
  }
  
  // Find matching celebrity data
  const bestMatch = findBestMatch(name);
  if (!bestMatch) {
    console.log(`No sentiment data found for ${name} to calculate grade`);
    return defaultGrade;
  }
  
  const sentimentData = sentimentCache.get(bestMatch) || [];
  if (sentimentData.length === 0) {
    console.log(`No sentiment data points available for ${bestMatch} to calculate grade`);
    return defaultGrade;
  }
  
  // Sort sentiment data by year (newest first)
  const sortedData = [...sentimentData].sort((a, b) => b.x - a.x);
  
  // Get the original -1 to +1 scale values (divide by 10 since we multiplied by 10 earlier)
  const sentimentValues = sortedData.map(point => point.y / 10);
  
  // ALGORITHM COMPONENTS:
  
  // 1. Recent sentiment (last 3 years) - 40% of grade
  const recentYears = sortedData.slice(0, Math.min(3, sortedData.length));
  const recentSentiment = recentYears.reduce((sum, point) => sum + point.y / 10, 0) / recentYears.length;
  
  // 2. Overall average sentiment - 25% of grade
  const overallSentiment = sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length;
  
  // 3. Trend direction (improving or declining) - 15% of grade
  // Calculate the slope of sentiment over time
  let trendFactor = 0;
  if (sortedData.length >= 3) {
    const oldestYear = sortedData[sortedData.length - 1].x;
    const newestYear = sortedData[0].x;
    const oldestSentiment = sortedData[sortedData.length - 1].y / 10;
    const newestSentiment = sortedData[0].y / 10;
    
    // Calculate the slope, if years span is zero, default to zero
    const yearSpan = newestYear - oldestYear;
    trendFactor = yearSpan !== 0 ? (newestSentiment - oldestSentiment) / yearSpan : 0;
  }
  
  // 4. Volatility (stability of public opinion) - 10% of grade
  // Calculate standard deviation of sentiment
  const mean = overallSentiment;
  const squaredDiffs = sentimentValues.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
  const volatility = Math.sqrt(avgSquaredDiff);
  
  // 5. Extremeness (how polarizing) - 10% of grade
  // Maximum absolute sentiment value
  const extremeSentimentValues = sortedData
    .filter(point => point.extremeScore !== undefined)
    .map(point => point.extremeScore!);
  
  const extremeness = extremeSentimentValues.length > 0
    ? extremeSentimentValues.reduce((max, val) => Math.max(max, Math.abs(val)), 0)
    : Math.max(...sentimentValues.map(val => Math.abs(val)));
  
  // FINAL SCORE CALCULATION:
  
  // Convert sentiment from -1,1 scale to 0-100 scale
  const normalizeScore = (sentiment: number) => (sentiment + 1) * 50;
  
  // Weight components
  const recentWeight = 0.40;
  const overallWeight = 0.25;
  const trendWeight = 0.15;
  const volatilityWeight = 0.10;
  const extremenessWeight = 0.10;
  
  // Calculate weighted score components
  const recentScore = normalizeScore(recentSentiment);
  const overallScore = normalizeScore(overallSentiment);
  
  // Trend bonus/penalty: -15 to +15 points
  const trendScore = 50 + (trendFactor * 150); // Scale trend factor to have meaningful impact
  
  // Volatility score: higher volatility = lower score
  const volatilityScore = 100 - (volatility * 75); // Scale volatility (typical range 0-1.3)
  
  // Extremeness score: more extreme = more polarizing = potentially higher score
  const extremenessScore = extremeness * 85; // Scale extremeness (0-1 range) to (0-85)
  
  // Calculate final weighted score
  let finalScore = (
    (recentScore * recentWeight) +
    (overallScore * overallWeight) +
    (trendScore * trendWeight) +
    (volatilityScore * volatilityWeight) +
    (extremenessScore * extremenessWeight)
  );
  
  // Ensure score is within 0-100 range
  finalScore = Math.max(0, Math.min(100, finalScore));
  
  // Convert numerical score to letter grade
  let letterGrade: string;
  if (finalScore >= 97) letterGrade = 'A+';
  else if (finalScore >= 93) letterGrade = 'A';
  else if (finalScore >= 90) letterGrade = 'A-';
  else if (finalScore >= 87) letterGrade = 'B+';
  else if (finalScore >= 83) letterGrade = 'B';
  else if (finalScore >= 80) letterGrade = 'B-';
  else if (finalScore >= 77) letterGrade = 'C+';
  else if (finalScore >= 73) letterGrade = 'C';
  else if (finalScore >= 70) letterGrade = 'C-';
  else if (finalScore >= 67) letterGrade = 'D+';
  else if (finalScore >= 63) letterGrade = 'D';
  else if (finalScore >= 60) letterGrade = 'D-';
  else letterGrade = 'F';
  
  // Generate description based on components
  let description = `Public sentiment grade based on ${sortedData.length} years of data.`;
  
  // Add sentiment trend description
  if (trendFactor > 0.05) {
    description += ' Public perception has been significantly improving over time.';
  } else if (trendFactor > 0.01) {
    description += ' Public perception has been gradually improving over time.';
  } else if (trendFactor < -0.05) {
    description += ' Public perception has been declining significantly over time.';
  } else if (trendFactor < -0.01) {
    description += ' Public perception has been gradually declining over time.';
  } else {
    description += ' Public perception has remained relatively stable over time.';
  }
  
  // Add volatility description
  if (volatility > 0.6) {
    description += ' Public opinion is highly volatile with dramatic shifts.';
  } else if (volatility > 0.3) {
    description += ' Public opinion shows moderate volatility.';
  } else {
    description += ' Public opinion shows consistent stability.';
  }
  
  return {
    letter: letterGrade,
    score: Math.round(finalScore),
    description
  };
}; 