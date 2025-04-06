import React, { useState } from 'react';
import { Container, Paper, Box, IconButton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchInput from '../components/SearchInput';
import ProfileInfo from '../components/ProfileInfo';
import TrendGraph from '../components/TrendGraph';
import Affiliations from '../components/Affiliations';
import TopicsList from '../components/TopicsList';

// Mock data - replace with actual API calls
const mockCelebrityData = {
  name: 'John Doe',
  birthday: 'XXX',
  age: 0,
  occupation: 'XXX',
  imageUrl: '/placeholder.jpg',
  publicsentiment: 'A+',
  bio: 'Insert bio here',
  affiliations: [
    { name: 'Name', imageUrl: '/placeholder.jpg' },
    { name: 'Name', imageUrl: '/placeholder.jpg' },
  ],
  topics: [
    { title: 'Topic 1', frequency: 10 },
    { title: 'Topic 2', frequency: 8 },
    { title: 'Topic 3', frequency: 5 },
  ],
};

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [celebrityData, setCelebrityData] = useState(mockCelebrityData);

  const handleSearch = async (query: string) => {
    // TODO: Replace with actual API call
    console.log('Searching for:', query);
    // For now, we'll just use the mock data
    setCelebrityData(mockCelebrityData);
  };

  return (
    <Box sx={{ bgcolor: '#fff4d9', minHeight: '100vh', width: '100%', position: 'absolute', left: 0, top: 0, pb: 4 }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ 
              mr: 2,
              color: '#3d2a1d',
              '&:hover': {
                backgroundColor: 'rgba(61, 42, 29, 0.04)'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <SearchInput onSearch={handleSearch} />
        </Box>
        
        {/* Profile Card */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: 2,
            bgcolor: '#fff9e8'
          }}
        >
          <ProfileInfo
            name={celebrityData.name}
            birthday={celebrityData.birthday}
            age={celebrityData.age}
            occupation={celebrityData.occupation}
            imageUrl={celebrityData.imageUrl}
            publicsentiment={celebrityData.publicsentiment}
            bio={celebrityData.bio}
          />
        </Paper>

        {/* Trend Graph Card */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: 2,
            bgcolor: '#fff9e8'
          }}
        >
          <TrendGraph />
        </Paper>
        
        {/* Bottom Section with Affiliations and Topics */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4
        }}>
          <Box sx={{ flex: 1 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3,
                height: '100%',
                borderRadius: 2,
                bgcolor: '#fff9e8'
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#3d2a1d', mb: 2 }}>
                Affiliated Public Figures
              </Typography>
              <Affiliations celebrities={celebrityData.affiliations} />
            </Paper>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3,
                height: '100%',
                borderRadius: 2,
                bgcolor: '#fff9e8'
              }}
            >
              <TopicsList 
                topics={celebrityData.topics} 
                name={celebrityData.name}
              />
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AnalysisPage; 