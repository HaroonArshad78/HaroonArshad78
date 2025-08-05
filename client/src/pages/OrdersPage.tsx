import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const OrdersPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Orders
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Orders management page - Implementation in progress
        </Typography>
      </Paper>
    </Box>
  );
};

export default OrdersPage;