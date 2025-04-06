import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Tooltip, CircularProgress } from '@mui/material';
import { SentimentGrade, calculatePublicSentimentGrade } from '../utils/sentimentService';

// New function to get celebrity image based on name
const getCelebrityImage = (name: string): string => {
  // Convert name to lowercase for case-insensitive comparison
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('kanye') || lowerName.includes('ye')) {
    return `${process.env.PUBLIC_URL}/images/kanye.png`;
  } else if (lowerName.includes('kamala')) {
    return `${process.env.PUBLIC_URL}/images/kamala.png`;
  } else if (lowerName.includes('will smith')) {
    return `${process.env.PUBLIC_URL}/images/willsmith.png`;
  } else if (lowerName.includes('donald') && lowerName.includes('trump')) {
    return `${process.env.PUBLIC_URL}/images/trump.png`;
  }
  
  // Default placeholder image
  return `${process.env.PUBLIC_URL}/images/default/profile-placeholder.svg`;
};

interface ProfileInfoProps {
  name: string;
  birthday: string;
  age: number;
  occupation: string;
  imageUrl: string;
  publicsentiment?: string; // Optional for backward compatibility
  bio?: string;
}

const getGradeColor = (grade: string) => {
  const baseGrade = grade.charAt(0).toUpperCase();
  switch (baseGrade) {
    case 'A':
      return '#2E7D32'; // Dark green
    case 'B':
      return '#1976D2'; // Blue
    case 'C':
      return '#ED6C02'; // Orange
    case 'D':
      return '#D32F2F'; // Light red
    case 'F':
      return '#C62828'; // Dark red
    default:
      return '#757575'; // Grey
  }
};

// Fallback explanation for backward compatibility
const getGradeExplanation = (grade: string): string => {
  const baseGrade = grade.charAt(0).toUpperCase();
  switch (baseGrade) {
    case 'A':
      return 'Overwhelmingly positive public perception. Analysis based on social media sentiment (40%), news coverage (30%), public engagements (20%), and audience reactions (10%).';
    case 'B':
      return 'Generally favorable public perception. Mostly positive coverage with occasional mixed reactions.';
    case 'C':
      return 'Mixed public perception. Equal distribution of positive and negative sentiment across media channels.';
    case 'D':
      return 'Generally unfavorable public perception. Predominantly negative coverage with some supportive audiences.';
    case 'F':
      return 'Significantly negative public perception. Widespread criticism and controversy across multiple platforms.';
    default:
      return 'Public sentiment analysis pending. Insufficient data for accurate assessment.';
  }
};

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  name,
  birthday,
  age,
  occupation,
  imageUrl,
  publicsentiment = 'N/A',
  bio = 'No biography available.',
}) => {
  const [sentimentGrade, setSentimentGrade] = useState<SentimentGrade | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch sentiment grade when component mounts
  useEffect(() => {
    const loadSentimentGrade = async () => {
      if (!name) return;
      
      setLoading(true);
      try {
        const grade = await calculatePublicSentimentGrade(name);
        setSentimentGrade(grade);
      } catch (error) {
        console.error('Error calculating sentiment grade:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSentimentGrade();
  }, [name]);
  
  // Use loaded grade or fallback to provided publicsentiment
  const displayGrade = sentimentGrade ? sentimentGrade.letter : publicsentiment;
  const gradeColor = getGradeColor(displayGrade);
  
  // Use detailed calculated explanation or fallback to basic explanation
  const gradeExplanation = sentimentGrade 
    ? sentimentGrade.description
    : getGradeExplanation(displayGrade);
  
  // Format occupation by replacing underscores with spaces
  const formattedOccupation = occupation.replace(/_/g, ' ');
  
  // Get the correct celebrity image based on name
  const displayImageUrl = getCelebrityImage(name);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, mb: 4 }}>
      <Avatar
        src={displayImageUrl}
        alt={name}
        sx={{
          width: 150,
          height: 150,
          bgcolor: 'grey.300',
          objectFit: 'cover',
          '& img': {
            objectFit: 'cover',
            width: '100%',
            height: '100%'
          }
        }}
      />
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#3d2a1d' }}>
          {name}
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: 'Poppins', color: '#6b4730' }}>
          Birthday: <Box component="span" sx={{ color: '#d89c62' }}>{birthday}</Box>
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: 'Poppins', color: '#6b4730' }}>
          Age: <Box component="span" sx={{ color: '#d89c62' }}>{age}</Box>
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: 'Poppins', color: '#6b4730' }}>
          Occupation: <Box component="span" sx={{ color: '#d89c62' }}>{formattedOccupation}</Box>
        </Typography>
      </Box>
      <Box sx={{ 
        flex: 1,
        px: 4,
        borderLeft: '1px solid',
        borderRight: '1px solid',
        borderColor: '#d89c62',
      }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontFamily: 'Poppins',
            lineHeight: 1.7,
            color: '#6b4730',
          }}
        >
          {bio}
        </Typography>
      </Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 1
      }}>
        {loading ? (
          <Box sx={{ 
            width: 100, 
            height: 100, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center'
          }}>
            <CircularProgress sx={{ color: '#3d2a1d' }} />
          </Box>
        ) : (
          <Tooltip 
            title={
              <Typography sx={{ fontFamily: 'Poppins', fontSize: '0.875rem', p: 1 }}>
                {gradeExplanation}
              </Typography>
            }
            arrow
            placement="left"
          >
            <Avatar 
              sx={{ 
                width: 100,
                height: 100,
                bgcolor: gradeColor,
                border: `4px solid ${gradeColor}`,
                fontSize: '2.5rem',
                fontFamily: 'Poppins',
                fontWeight: 600,
                cursor: 'help'
              }}
            >
              {displayGrade}
            </Avatar>
          </Tooltip>
        )}
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontFamily: 'Poppins',
            fontWeight: 500,
            color: '#6b4730'
          }}
        >
          Public Sentiment
          {sentimentGrade && (
            <Typography component="span" variant="caption" sx={{ display: 'block', fontSize: '0.7rem', color: '#d89c62' }}>
              Score: {sentimentGrade.score}/100
            </Typography>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileInfo; 