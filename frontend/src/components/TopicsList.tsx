import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

interface Topic {
  title: string;
  frequency: number;
}

interface TopicsListProps {
  topics: Topic[];
  name: string;
}

const TopicsList: React.FC<TopicsListProps> = ({ topics, name }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Poppins', fontWeight: 600, color: '#3d2a1d' }}>
        Most Talked About Topics Regarding{' '}
        <Box component="span" sx={{ fontWeight: 900 }}>
          {name}
        </Box>
      </Typography>
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
    </Box>
  );
};

export default TopicsList; 