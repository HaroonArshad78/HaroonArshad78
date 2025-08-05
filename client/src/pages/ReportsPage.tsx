import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ReportsPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Reports and analytics page - Implementation in progress
        </Typography>
      </Paper>
    </Box>
  );
};

export default ReportsPage;