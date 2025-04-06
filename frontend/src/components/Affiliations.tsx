import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

interface AffiliatedCelebrity {
  name: string;
  imageUrl: string;
}

interface AffiliationsProps {
  celebrities: AffiliatedCelebrity[];
}

const Affiliations: React.FC<AffiliationsProps> = ({ celebrities }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 2 }}>
        {celebrities.map((celebrity, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 1,
              gap: 1,
            }}
          >
            <Avatar
              src={celebrity.imageUrl}
              alt={celebrity.name}
              sx={{ width: 60, height: 60 }}
            />
            <Typography variant="body2" align="center" sx={{ fontFamily: 'Poppins' }}>
              {celebrity.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Affiliations; 