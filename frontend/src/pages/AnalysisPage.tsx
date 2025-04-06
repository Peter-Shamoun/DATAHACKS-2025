import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Box, 
  IconButton, 
  Typography, 
  CircularProgress,
  Button,
  Alert
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchInput from '../components/SearchInput';
import ProfileInfo from '../components/ProfileInfo';
import TrendGraph from '../components/TrendGraph';
import Affiliations from '../components/Affiliations';
import TopicsList from '../components/TopicsList';
import { Celebrity } from '../types/Celebrity';
import { getCelebrityById, initializeSearch } from '../utils/searchService';

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [celebrityData, setCelebrityData] = useState<Celebrity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize the search service
  useEffect(() => {
    const init = async () => {
      try {
        await initializeSearch();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize search:', error);
        setError('Failed to load celebrity data. Please try refreshing the page.');
        setLoading(false);
      }
    };
    
    init();
  }, []);

  // Load celebrity data once the search service is initialized
  useEffect(() => {
    if (!initialized) return;
    
    const loadCelebrity = async () => {
      if (id) {
        try {
          setLoading(true);
          setError(null);
          
          const celebrityId = parseInt(id, 10);
          if (isNaN(celebrityId)) {
            throw new Error('Invalid celebrity ID');
          }
          
          const celebrity = getCelebrityById(celebrityId);
          if (!celebrity) {
            throw new Error(`Celebrity with ID ${id} not found`);
          }
          
          setCelebrityData(celebrity);
          
          // Add a slight delay to ensure loading indicator is visible even for fast loads
          setTimeout(() => {
            setLoading(false);
          }, 500);
        } catch (error) {
          console.error('Error loading celebrity:', error);
          setError(error instanceof Error ? error.message : 'Failed to load celebrity data');
          setCelebrityData(null);
          setLoading(false);
        }
      }
    };

    loadCelebrity();
  }, [id, initialized]);

  const handleSearch = (celebrity: Celebrity) => {
    navigate(`/analysis/${celebrity.id}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ 
        bgcolor: '#fff4d9', 
        minHeight: '100vh', 
        width: '100%', 
        position: 'absolute', 
        left: 0, 
        top: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#3d2a1d', mb: 2 }} />
          <Typography variant="h6" sx={{ fontFamily: 'Poppins', color: '#3d2a1d' }}>
            Loading celebrity data...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ 
        bgcolor: '#fff4d9', 
        minHeight: '100vh', 
        width: '100%', 
        position: 'absolute', 
        left: 0, 
        top: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Container maxWidth="sm">
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              bgcolor: '#fff9e8',
              textAlign: 'center'
            }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              onClick={handleBackToHome}
              sx={{ 
                bgcolor: '#3d2a1d',
                '&:hover': {
                  bgcolor: '#2a1f16'
                }
              }}
            >
              Back to Home
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Not found state
  if (!celebrityData) {
    return (
      <Box sx={{ 
        bgcolor: '#fff4d9', 
        minHeight: '100vh', 
        width: '100%', 
        position: 'absolute', 
        left: 0, 
        top: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Container maxWidth="sm">
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              bgcolor: '#fff9e8',
              textAlign: 'center'
            }}
          >
            <Alert severity="warning" sx={{ mb: 3 }}>
              Celebrity not found
            </Alert>
            <Button 
              variant="contained" 
              onClick={handleBackToHome}
              sx={{ 
                bgcolor: '#3d2a1d',
                '&:hover': {
                  bgcolor: '#2a1f16'
                }
              }}
            >
              Back to Home
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Convert the celebrity data to the format expected by the components
  const formattedData = {
    name: celebrityData.name,
    birthday: celebrityData.birthday,
    age: celebrityData.age,
    occupation: celebrityData.occupation,
    imageUrl: '/placeholder.jpg', // Placeholder for now
    bio: celebrityData.bio,
    affiliations: celebrityData.alsoViewed.map(name => ({ 
      name, 
      imageUrl: '/placeholder.jpg' 
    })),
  };

  return (
    <Box sx={{ bgcolor: '#fff4d9', minHeight: '100vh', width: '100%', position: 'absolute', left: 0, top: 0, pb: 4 }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton 
            onClick={handleBackToHome}
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
          <SearchInput onSearch={(celebrity) => {
            // Show loading indicator before navigating
            setLoading(true);
            navigate(`/analysis/${celebrity.id}`);
          }} />
        </Box>
        
        {loading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={60} sx={{ color: '#3d2a1d' }} />
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', color: '#3d2a1d' }}>
              Loading {formattedData ? formattedData.name : 'celebrity'} data...
            </Typography>
          </Box>
        )}
        
        {!loading && (
          <>
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
                name={formattedData.name}
                birthday={formattedData.birthday}
                age={formattedData.age}
                occupation={formattedData.occupation}
                imageUrl={formattedData.imageUrl}
                bio={formattedData.bio}
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
              <TrendGraph celebrityName={formattedData.name} popularityThreshold={5} />
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
                  <Affiliations celebrities={formattedData.affiliations} />
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
                  <TopicsList name={formattedData.name} />
                </Paper>
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default AnalysisPage; 