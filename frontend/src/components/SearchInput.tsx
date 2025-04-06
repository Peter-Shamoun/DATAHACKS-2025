import React, { useState } from 'react';
import { TextField, Button, Box, Container } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchInputProps {
  onSearch: (query: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          gap: 2,
          my: 4,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Enter celebrity name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{ minWidth: '120px' }}
          startIcon={<SearchIcon />}
        >
          Search
        </Button>
      </Box>
    </Container>
  );
};

export default SearchInput; 