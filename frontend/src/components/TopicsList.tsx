import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Link, CircularProgress } from '@mui/material';
import { ExtremeSentimentItem, getExtremeSentimentTitles } from '../utils/sentimentService';

interface Topic {
  title: string;
  frequency: number;
}

interface TopicsListProps {
  topics?: Topic[];
  name: string;
}

const TopicsList: React.FC<TopicsListProps> = ({ topics = [], name }) => {
  const [extremeTitles, setExtremeTitles] = useState<ExtremeSentimentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadExtremeTitles = async () => {
      if (!name) return;
      
      setLoading(true);
      try {
        const titles = await getExtremeSentimentTitles(name, 3);
        setExtremeTitles(titles);
      } catch (error) {
        console.error('Error loading extreme sentiment titles:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadExtremeTitles();
  }, [name]);

  // Helper function to format sentiment score
  const formatSentimentScore = (score: number) => {
    // Round to 2 decimal places
    const roundedScore = Math.round(score * 100) / 100;
    
    // Determine color and label based on sentiment value
    let color, label;
    if (roundedScore >= 0.7) {
      color = '#4caf50'; // Green for very positive
      label = 'Very Positive';
    } else if (roundedScore >= 0.3) {
      color = '#8bc34a'; // Light green for positive
      label = 'Positive';
    } else if (roundedScore >= -0.3) {
      color = '#9e9e9e'; // Grey for neutral
      label = 'Neutral';
    } else if (roundedScore >= -0.7) {
      color = '#ff9800'; // Orange for negative
      label = 'Negative';
    } else {
      color = '#f44336'; // Red for very negative
      label = 'Very Negative';
    }
    
    return (
      <Box component="span" sx={{ color, fontWeight: 600 }}>
        {label} ({roundedScore})
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#3d2a1d' }}>
        Most Talked About Topics Regarding{' '}
        <Box component="span" sx={{ fontWeight: 900 }}>
          {name}
        </Box>
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} sx={{ color: '#3d2a1d' }} />
        </Box>
      ) : extremeTitles.length > 0 ? (
        <List>
          {extremeTitles.map((item, index) => (
            <ListItem key={index} sx={{ display: 'block', mb: 1.5 }}>
              <Typography sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#6b4730', fontSize: '1rem' }}>
                {item.year}: {formatSentimentScore(item.score)}
              </Typography>
              <Typography sx={{ fontFamily: 'Poppins', color: '#5f4c3a', mt: 0.5, fontSize: '0.9rem', lineHeight: 1.4 }}>
                {item.link ? (
                  <Link 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      color: '#5f4c3a',
                      textDecoration: 'none',
                      '&:hover': { 
                        textDecoration: 'underline',
                        color: '#d89c62' 
                      }
                    }}
                  >
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </Typography>
            </ListItem>
          ))}
        </List>
      ) : topics.length > 0 ? (
        <List>
          {topics.map((topic, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={<Typography sx={{ fontFamily: 'Poppins', fontWeight: 500, color: '#6b4730' }}>{topic.title}</Typography>}
                secondary={
                  <Typography variant="body2" sx={{ fontFamily: 'Poppins', color: '#d89c62' }}>
                    Mentioned {topic.frequency} times
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography sx={{ fontFamily: 'Poppins', color: '#6b4730', py: 2, fontStyle: 'italic' }}>
          No notable topics found for this celebrity.
        </Typography>
      )}
    </Box>
  );
};

export default TopicsList; 