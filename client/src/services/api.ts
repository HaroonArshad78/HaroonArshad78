import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface Order {
  id: number;
  orderId: string;
  officeId: number;
  agentId: number;
  installationType: 'INSTALLATION' | 'REMOVAL' | 'REPAIR';
  propertyType: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  listingDate?: string;
  expirationDate?: string;
  installationDate?: string;
  completionDate?: string;
  directions?: string;
  additionalInfo?: string;
  underwaterSprinkler: boolean;
  invisibleDogFence: boolean;
  vendorId?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  office?: any;
  agent?: any;
  vendor?: any;
  reorders?: any[];
}

export interface Reorder {
  id: number;
  reorderId: string;
  originalOrderId: number;
  installationType: 'INSTALLATION' | 'REMOVAL' | 'REPAIR';
  zipCode: string;
  additionalInfo?: string;
  listingAgentId: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  listingAgent?: any;
}

export interface CCEmail {
  id: number;
  email: string;
  officeId: number;
  agentId?: number;
  enteredBy: number;
  modifiedBy?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  office?: any;
  agent?: any;
  enteredByUser?: any;
  modifiedByUser?: any;
}

export interface Office {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  managerEmail?: string;
  isActive: boolean;
}

export interface Agent {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  officeId?: number;
  office?: Office;
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  serviceAreas?: string[];
  isActive: boolean;
}

// API Services
export const authAPI = {
  login: (data: LoginRequest) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

export const ordersAPI = {
  getOrders: (params: any) => api.get('/orders', { params }),
  getOrder: (id: number) => api.get(`/orders/${id}`),
  createOrder: (data: Partial<Order>) => api.post('/orders', data),
  updateOrder: (id: number, data: Partial<Order>) => api.put(`/orders/${id}`, data),
  deleteOrder: (id: number) => api.delete(`/orders/${id}`),
  checkReorderEligibility: (id: number) => api.get(`/orders/eligible-for-reorder/${id}`),
};

export const reordersAPI = {
  getReordersByOrder: (orderId: number) => api.get(`/reorders/order/${orderId}`),
  createReorder: (data: Partial<Reorder>) => api.post('/reorders', data),
  updateReorder: (id: number, data: Partial<Reorder>) => api.put(`/reorders/${id}`, data),
  deleteReorder: (id: number) => api.delete(`/reorders/${id}`),
};

export const reportsAPI = {
  generateReport: (filters: any) => api.post('/reports/generate', filters),
  downloadReport: (filename: string) => api.get(`/reports/download/${filename}`, { responseType: 'blob' }),
  previewReport: (filters: any) => api.post('/reports/preview', filters),
};

export const ccEmailsAPI = {
  getCCEmails: (params: any) => api.get('/ccemails', { params }),
  getCCEmail: (id: number) => api.get(`/ccemails/${id}`),
  createCCEmail: (data: Partial<CCEmail>) => api.post('/ccemails', data),
  updateCCEmail: (id: number, data: Partial<CCEmail>) => api.put(`/ccemails/${id}`, data),
  deleteCCEmail: (id: number) => api.delete(`/ccemails/${id}`),
};

export const lookupsAPI = {
  getOffices: () => api.get('/lookups/offices'),
  getAgents: (params?: any) => api.get('/lookups/agents', { params }),
  getVendors: (params?: any) => api.get('/lookups/vendors', { params }),
  getInstallationTypes: () => api.get('/lookups/installation-types'),
  getPropertyTypes: () => api.get('/lookups/property-types'),
  getStates: () => api.get('/lookups/states'),
  createOffice: (data: Partial<Office>) => api.post('/lookups/offices', data),
  createVendor: (data: Partial<Vendor>) => api.post('/lookups/vendors', data),
  updateVendor: (id: number, data: Partial<Vendor>) => api.put(`/lookups/vendors/${id}`, data),
};

export default api;