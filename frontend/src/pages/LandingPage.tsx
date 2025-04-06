import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import { Celebrity } from '../types/Celebrity';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSearch = (celebrity: Celebrity) => {
    // Navigate to the analysis page with the celebrity ID
    navigate(`/analysis/${celebrity.id}`);
  };

  return (
    <Box sx={{ bgcolor: '#fff4d9', minHeight: '100vh', width: '100vw', position: 'fixed', left: 0, top: 0 }}>
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Box
            component="img"
            src="images/stanscan-dino.png"
            alt="StanScan Dinosaur Logo"
            sx={{
              width: { xs: '150px', sm: '180px', md: '220px' },
              height: 'auto',
              mb: -1
            }}
          />
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: 'Poppins',
              fontWeight: 600,
              textAlign: 'center',
              mb: -2,
              color: '#3d2a1d'
            }}
          >
            STANSCAN.AI
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: 'Poppins',
              color: '#6b4730',
              textAlign: 'center',
              maxWidth: 600,
              mb: -2
            }}
          >
            To stan or not to stan? <br /> Find out if your favorite celebrity is really worth all the love you give them...
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 600 }}>
            <SearchInput onSearch={handleSearch} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage; 