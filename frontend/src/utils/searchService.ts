import Fuse from 'fuse.js';
import { Celebrity } from '../types/Celebrity';
import { loadCelebrityData } from './csvService';

let celebrityData: Celebrity[] = [];
let fuseInstance: Fuse<Celebrity> | null = null;
let initializationPromise: Promise<void> | null = null;

// Initialize the search service
export const initializeSearch = async (): Promise<void> => {
  // If already initializing, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Create a new initialization promise
  initializationPromise = (async () => {
    try {
      console.log('Initializing search service...');
      celebrityData = await loadCelebrityData();
      
      if (celebrityData.length === 0) {
        console.error('No celebrity data loaded');
        throw new Error('No celebrity data loaded');
      }
      
      console.log(`Loaded ${celebrityData.length} celebrities for search`);
      
      // Configure Fuse.js for fuzzy search
      const options = {
        keys: ['name'],
        threshold: 0.3,
        includeScore: true
      };
      
      fuseInstance = new Fuse(celebrityData, options);
      console.log('Search service initialized successfully');
    } catch (error) {
      console.error('Error initializing search:', error);
      // Reset the promise so we can try again
      initializationPromise = null;
      throw error; // Re-throw the error to be caught by the caller
    }
  })();
  
  // Wait for the initialization to complete
  await initializationPromise.catch((error) => {
    initializationPromise = null;
    throw error;
  });
  
  return initializationPromise;
};

// Search for celebrities
export const searchCelebrities = (query: string): Celebrity[] => {
  if (!fuseInstance) {
    console.warn('Search not initialized');
    return [];
  }
  
  if (!query.trim()) {
    return [];
  }
  
  try {
    const results = fuseInstance.search(query);
    console.log(`Search for "${query}" returned ${results.length} results`);
    return results.map(result => result.item).slice(0, 5); // Limit to 5 results
  } catch (error) {
    console.error('Error searching celebrities:', error);
    return [];
  }
};

// Get a celebrity by ID
export const getCelebrityById = (id: number): Celebrity | undefined => {
  if (!celebrityData.length) {
    console.warn('Celebrity data not loaded');
    return undefined;
  }
  
  const celebrity = celebrityData.find(celebrity => celebrity.id === id);
  
  if (!celebrity) {
    console.warn(`Celebrity with ID ${id} not found`);
  }
  
  return celebrity;
};

// Get a celebrity by name
export const getCelebrityByName = (name: string): Celebrity | undefined => {
  if (!celebrityData.length) {
    console.warn('Celebrity data not loaded');
    return undefined;
  }
  
  const celebrity = celebrityData.find(celebrity => celebrity.name === name);
  
  if (!celebrity) {
    console.warn(`Celebrity with name "${name}" not found`);
  }
  
  return celebrity;
};

// Get all celebrities
export const getAllCelebrities = (): Celebrity[] => {
  if (!celebrityData.length) {
    console.warn('Celebrity data not loaded');
    return [];
  }
  
  return [...celebrityData];
}; 