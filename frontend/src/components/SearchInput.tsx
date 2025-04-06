import React from 'react';
import { Box, Container } from '@mui/material';
import SearchAutocomplete from './SearchAutocomplete';
import { Celebrity } from '../types/Celebrity';

interface SearchInputProps {
  onSearch: (celebrity: Celebrity) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <SearchAutocomplete onSelect={onSearch} />
      </Box>
    </Container>
  );
};

export default SearchInput; 