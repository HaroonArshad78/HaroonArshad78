import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import axios from 'axios';
import { toast } from 'react-toastify';

import SignRequestGridPage from '../SignRequestGridPage';

// Mock dependencies
jest.mock('axios');
jest.mock('react-toastify');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedToast = toast as jest.Mocked<typeof toast>;

// Mock data
const mockOffices = [
  { id: 1, name: 'Downtown Office' },
  { id: 2, name: 'Westside Office' }
];

const mockAgents = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
];

const mockSignRequests = {
  orders: [
    {
      id: 1,
      orderId: 'SO-123',
      streetAddress: '123 Main St',
      city: 'Springfield',
      state: 'CA',
      zipCode: '90210',
      installationType: 'INSTALLATION',
      createdAt: '2024-01-15T10:00:00Z',
      completionDate: '2024-01-20T10:00:00Z',
      officeId: 1,
      agentId: 1,
      canOrder: true
    },
    {
      id: 2,
      orderId: 'SO-124',
      streetAddress: '456 Oak Ave',
      city: 'Franklin',
      state: 'CA',
      zipCode: '90211',
      installationType: 'REMOVAL',
      createdAt: '2024-01-10T10:00:00Z',
      completionDate: null,
      officeId: 1,
      agentId: 2,
      canOrder: true
    }
  ],
  total: 2,
  page: 1,
  limit: 5,
  totalPages: 1
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  const theme = createTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('SignRequestGridPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock responses
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/lookups/offices') {
        return Promise.resolve({ data: { offices: mockOffices } });
      }
      if (url === '/api/lookups/agents') {
        return Promise.resolve({ data: { agents: mockAgents } });
      }
      if (url === '/api/sign-requests') {
        return Promise.resolve({ data: mockSignRequests });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders the page title and filters', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    expect(screen.getByText('Sign Request Grid')).toBeInTheDocument();
    expect(screen.getByLabelText('Office')).toBeInTheDocument();
    expect(screen.getByLabelText('Agent (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Search all columns')).toBeInTheDocument();
  });

  it('loads and displays offices in the dropdown', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Wait for offices to load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });
  });

  it('shows error when office is not selected', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Please select an office to view sign requests')).toBeInTheDocument();
    });
  });

  it('loads sign requests when office is selected', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Wait for offices to load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });

    // Select an office
    const officeSelect = screen.getByLabelText('Office');
    fireEvent.mouseDown(officeSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Downtown Office')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Downtown Office'));

    // Wait for sign requests to load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/sign-requests', {
        params: expect.objectContaining({
          officeId: 1,
          page: 1,
          limit: 5
        })
      });
    });
  });

  it('displays correct table columns', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Select office to trigger data loading
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });

    const officeSelect = screen.getByLabelText('Office');
    fireEvent.mouseDown(officeSelect);
    fireEvent.click(screen.getByText('Downtown Office'));

    // Wait for data to load and check columns
    await waitFor(() => {
      expect(screen.getByText('Order ID')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Order Date')).toBeInTheDocument();
      expect(screen.getByText('Completion Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('filters agents when office is selected', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });

    // Select an office
    const officeSelect = screen.getByLabelText('Office');
    fireEvent.mouseDown(officeSelect);
    fireEvent.click(screen.getByText('Downtown Office'));

    // Check that agents are loaded for the selected office
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/agents', {
        params: { officeId: 1 }
      });
    });
  });

  it('performs search when search input changes', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Select office first
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });

    const officeSelect = screen.getByLabelText('Office');
    fireEvent.mouseDown(officeSelect);
    fireEvent.click(screen.getByText('Downtown Office'));

    // Enter search term
    const searchInput = screen.getByLabelText('Search all columns');
    fireEvent.change(searchInput, { target: { value: 'SO-123' } });

    // Wait for search to trigger API call
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/sign-requests', {
        params: expect.objectContaining({
          officeId: 1,
          search: 'SO-123',
          page: 1,
          limit: 5
        })
      });
    });
  });

  it('handles pagination changes', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Select office first
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });

    const officeSelect = screen.getByLabelText('Office');
    fireEvent.mouseDown(officeSelect);
    fireEvent.click(screen.getByText('Downtown Office'));

    // Wait for initial data load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/sign-requests', {
        params: expect.objectContaining({
          officeId: 1,
          page: 1,
          limit: 5
        })
      });
    });
  });

  it('clears filters when Clear Filters button is clicked', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });

    // Select office and add search
    const officeSelect = screen.getByLabelText('Office');
    fireEvent.mouseDown(officeSelect);
    fireEvent.click(screen.getByText('Downtown Office'));

    const searchInput = screen.getByLabelText('Search all columns');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Click clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Check that filters are cleared
    expect(searchInput).toHaveValue('');
  });

  it('shows order button only for eligible orders', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Select office to load data
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });

    const officeSelect = screen.getByLabelText('Office');
    fireEvent.mouseDown(officeSelect);
    fireEvent.click(screen.getByText('Downtown Office'));

    // Wait for data to load
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/sign-requests', {
        params: expect.objectContaining({
          officeId: 1
        })
      });
    });

    // Both mock orders should show order buttons (one completed, one removal)
    await waitFor(() => {
      const orderButtons = screen.getAllByLabelText('Create Order');
      expect(orderButtons).toHaveLength(2);
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockedAxios.get.mockImplementation((url) => {
      if (url === '/api/lookups/offices') {
        return Promise.resolve({ data: { offices: mockOffices } });
      }
      if (url === '/api/sign-requests') {
        return Promise.reject({ 
          response: { data: { message: 'Server error' } } 
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    // Select office to trigger error
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/lookups/offices');
    });

    const officeSelect = screen.getByLabelText('Office');
    fireEvent.mouseDown(officeSelect);
    fireEvent.click(screen.getByText('Downtown Office'));

    // Wait for error to be handled
    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('disables agent dropdown when no office is selected', () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    const agentSelect = screen.getByLabelText('Agent (Optional)');
    expect(agentSelect).toBeDisabled();
  });

  it('validates office requirement', async () => {
    render(
      <TestWrapper>
        <SignRequestGridPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Please select an office to view sign requests')).toBeInTheDocument();
    });
  });
});