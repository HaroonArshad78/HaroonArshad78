import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  Assignment,
  BarChart,
  Email,
  ViewList,
  Dashboard
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Orders',
      icon: <Assignment />,
      path: '/orders',
      description: 'Manage sign orders'
    },
    {
      text: 'Sign Requests',
      icon: <ViewList />,
      path: '/sign-requests',
      description: 'View and filter sign orders'
    },
    {
      text: 'Reports',
      icon: <BarChart />,
      path: '/reports',
      description: 'View reports and analytics'
    },
    {
      text: 'CC Emails',
      icon: <Email />,
      path: '/cc-emails',
      description: 'Manage CC email settings'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          marginTop: '64px', // Account for AppBar height
          height: 'calc(100vh - 64px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: '#f8f9fa'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Sign Order System
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Navigation Menu
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white'
                    }
                  },
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'text.secondary',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  secondary={!isActive ? item.description : undefined}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;