import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CCEmailsPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CC Emails
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          CC email management page - Implementation in progress
        </Typography>
      </Paper>
    </Box>
  );
};

export default CCEmailsPage;