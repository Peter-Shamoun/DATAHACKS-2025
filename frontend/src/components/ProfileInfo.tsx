import React from 'react';
import { Box, Typography, Avatar, Tooltip } from '@mui/material';

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
  const gradeColor = getGradeColor(publicsentiment);
  const gradeExplanation = getGradeExplanation(publicsentiment);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4, mb: 4 }}>
      <Avatar
        src={imageUrl}
        alt={name}
        sx={{
          width: 150,
          height: 150,
          bgcolor: 'grey.300',
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
          Occupation: <Box component="span" sx={{ color: '#d89c62' }}>{occupation}</Box>
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
            {publicsentiment}
          </Avatar>
        </Tooltip>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontFamily: 'Poppins',
            fontWeight: 500,
            color: '#6b4730'
          }}
        >
          Public Sentiment
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileInfo; 