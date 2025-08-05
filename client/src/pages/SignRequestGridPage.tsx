import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Alert
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowsProp,
  GridToolbar,
  GridActionsCellItem,
  GridRowId
} from '@mui/x-data-grid';
import {
  Search,
  FilterList,
  Visibility,
  VisibilityOff,
  Assignment
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import axios from 'axios';

interface Office {
  id: number;
  name: string;
}

interface Agent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface SignRequest {
  id: number;
  orderId: string;
  address: string;
  type: string;
  orderDate: string;
  completionDate: string | null;
  installationDate: string | null;
  status: string;
  officeId: number;
  agentId: number;
  office?: Office;
  agent?: Agent;
  canOrder: boolean;
}

interface SignRequestFilters {
  officeId: number | '';
  agentId: number | '';
  search: string;
}

const SignRequestGridPage: React.FC = () => {
  const [filters, setFilters] = useState<SignRequestFilters>({
    officeId: '',
    agentId: '',
    search: ''
  });
  
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5
  });

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    id: false,
    orderId: true,
    address: true,
    type: true,
    orderDate: true,
    completionDate: true,
    actions: true
  });

  // Fetch offices
  const { data: officesData } = useQuery('offices', async () => {
    const response = await axios.get('/api/lookups/offices');
    return response.data.offices;
  });

  // Fetch agents based on selected office
  const { data: agentsData } = useQuery(
    ['agents', filters.officeId],
    async () => {
      const params = filters.officeId ? { officeId: filters.officeId } : {};
      const response = await axios.get('/api/lookups/agents', { params });
      return response.data.agents;
    },
    { enabled: true }
  );

  // Fetch sign requests
  const { data: signRequestsData, isLoading, error, refetch } = useQuery(
    ['signRequests', filters, paginationModel],
    async () => {
      if (!filters.officeId) {
        throw new Error('Office selection is required');
      }

      const params = {
        officeId: filters.officeId,
        ...(filters.agentId && { agentId: filters.agentId }),
        ...(filters.search && { search: filters.search }),
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize
      };

      const response = await axios.get('/api/sign-requests', { params });
      return response.data;
    },
    {
      enabled: !!filters.officeId,
      keepPreviousData: true,
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to fetch sign requests');
      }
    }
  );

  // Reset agent filter when office changes
  useEffect(() => {
    if (filters.officeId) {
      setFilters(prev => ({ ...prev, agentId: '' }));
    }
  }, [filters.officeId]);

  const handleFilterChange = (field: keyof SignRequestFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleOrderClick = (id: GridRowId) => {
    const row = signRequestsData?.orders?.find((order: SignRequest) => order.id === id);
    if (row) {
      // Navigate to order form or handle order action
      toast.info(`Order action for ${row.orderId} - Implementation needed`);
    }
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
      type: 'number'
    },
    {
      field: 'orderId',
      headerName: 'Order ID',
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          variant="outlined" 
          color="primary"
        />
      )
    },
    {
      field: 'address',
      headerName: 'Address',
      width: 250,
      valueGetter: (params) => {
        const row = params.row;
        return `${row.streetAddress || ''}, ${row.city || ''}, ${row.state || ''} ${row.zipCode || ''}`.trim();
      }
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      valueGetter: (params) => params.row.installationType,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'INSTALLATION' ? 'success' : params.value === 'REMOVAL' ? 'warning' : 'default'}
        />
      )
    },
    {
      field: 'orderDate',
      headerName: 'Order Date',
      width: 120,
      type: 'date',
      valueGetter: (params) => params.row.createdAt ? new Date(params.row.createdAt) : null,
      renderCell: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '-';
      }
    },
    {
      field: 'completionDate',
      headerName: 'Completion Date',
      width: 140,
      type: 'date',
      valueGetter: (params) => params.row.completionDate ? new Date(params.row.completionDate) : null,
      renderCell: (params) => {
        return params.value ? new Date(params.value).toLocaleDateString() : '-';
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => {
        const row = params.row;
        const canOrder = row.completionDate || row.installationType === 'REMOVAL';
        
        return canOrder ? [
          <GridActionsCellItem
            key="order"
            icon={
              <Tooltip title="Create Order">
                <Assignment />
              </Tooltip>
            }
            label="Order"
            onClick={() => handleOrderClick(params.id)}
            color="primary"
          />
        ] : [];
      }
    }
  ], []);

  const rows: GridRowsProp = signRequestsData?.orders || [];
  const totalRows = signRequestsData?.total || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sign Request Grid
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth required>
              <InputLabel>Office</InputLabel>
              <Select
                value={filters.officeId}
                onChange={(e) => handleFilterChange('officeId', e.target.value)}
                label="Office"
              >
                <MenuItem value="">
                  <em>Select Office</em>
                </MenuItem>
                {officesData?.map((office: Office) => (
                  <MenuItem key={office.id} value={office.id}>
                    {office.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Agent (Optional)</InputLabel>
              <Select
                value={filters.agentId}
                onChange={(e) => handleFilterChange('agentId', e.target.value)}
                label="Agent (Optional)"
                disabled={!filters.officeId}
              >
                <MenuItem value="">
                  <em>All Agents</em>
                </MenuItem>
                {agentsData?.map((agent: Agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.firstName} {agent.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search all columns"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search orders..."
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setFilters({ officeId: '', agentId: '', search: '' });
                setPaginationModel({ page: 0, pageSize: 5 });
              }}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {filters.officeId ? 'Failed to load sign requests' : 'Please select an office to view sign requests'}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25, 50]}
          rowCount={totalRows}
          paginationMode="server"
          loading={isLoading}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: false,
              printOptions: { disableToolbarButton: true },
              csvOptions: { disableToolbarButton: true }
            }
          }}
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
          disableRowSelectionOnClick
          autoHeight={false}
        />
      </Paper>
    </Box>
  );
};

export default SignRequestGridPage;