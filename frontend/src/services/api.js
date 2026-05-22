import axios from 'axios';

// In production, VITE_API_URL points to the Render backend (e.g. https://logistics-ai-tracker-api.onrender.com/api)
// In local dev, falls back to '/api' which is proxied by Vite to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// Shipments
export const getShipments = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.carrier) params.append('carrier', filters.carrier);
  if (filters.search) params.append('search', filters.search);
  if (filters.skip !== undefined) params.append('skip', filters.skip);
  if (filters.limit !== undefined) params.append('limit', filters.limit);
  return api.get(`/shipments?${params.toString()}`);
};

export const getShipmentById = async (id) => {
  return api.get(`/shipments/${id}`);
};

export const getShipmentStats = async () => {
  return api.get('/shipments/stats');
};

// Freight Rates
export const getFreightRates = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.mode) params.append('mode', filters.mode);
  if (filters.origin) params.append('origin', filters.origin);
  if (filters.destination) params.append('destination', filters.destination);
  if (filters.carrier) params.append('carrier', filters.carrier);
  return api.get(`/freight/rates?${params.toString()}`);
};

export const getFreightQuote = async (params) => {
  const queryParams = new URLSearchParams();
  if (params.origin) queryParams.append('origin', params.origin);
  if (params.destination) queryParams.append('destination', params.destination);
  if (params.weight) queryParams.append('weight', params.weight);
  if (params.mode) queryParams.append('mode', params.mode);
  return api.get(`/freight/quote?${queryParams.toString()}`);
};

// Chat
export const sendChatMessage = async (message, sessionId = null) => {
  return api.post('/chat', {
    message,
    session_id: sessionId,
  });
};

export const getChatSuggestions = async () => {
  return api.get('/chat/suggestions');
};

export default api;
