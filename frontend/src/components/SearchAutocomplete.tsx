import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Box, 
  Container,
  CircularProgress,
  Alert
} from '@mui/material';
import { Celebrity } from '../types/Celebrity';
import { initializeSearch, searchCelebrities } from '../utils/searchService';

interface SearchAutocompleteProps {
  onSelect: (celebrity: Celebrity) => void;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({ onSelect }) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the search service when the component mounts
  useEffect(() => {
    const init = async () => {
      try {
        setInitializing(true);
        setError(null);
        await initializeSearch();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize search:', error);
        setError('Failed to load celebrity data. Please try refreshing the page.');
      } finally {
        setInitializing(false);
      }
    };
    
    init();
  }, []);

  // Update options when input changes
  useEffect(() => {
    if (!initialized) return;
    
    if (!inputValue.trim()) {
      setOptions([]);
      return;
    }
    
    setLoading(true);
    
    // Debounce the search to avoid too many calls
    const timer = setTimeout(() => {
      try {
        const results = searchCelebrities(inputValue);
        setOptions(results);
      } catch (error) {
        console.error('Error searching celebrities:', error);
        setError('Failed to search celebrities. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [inputValue, initialized]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Autocomplete
          freeSolo
          options={options}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return option.name;
          }}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
            setError(null); // Clear any previous errors when user types
          }}
          onChange={(event, newValue) => {
            if (newValue && typeof newValue !== 'string') {
              onSelect(newValue);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              variant="outlined"
              placeholder={initializing ? "Loading celebrity data..." : "Enter celebrity name..."}
              disabled={initializing}
              error={!!error}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {(loading || initializing) ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => {
            // Extract the key from props to avoid spreading it
            const { key, ...otherProps } = props;
            return (
              <Box component="li" key={key} {...otherProps}>
                {option.name}
              </Box>
            );
          }}
        />
      </Box>
    </Container>
  );
};

export default SearchAutocomplete; 