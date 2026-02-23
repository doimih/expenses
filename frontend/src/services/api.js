import axios from 'axios';

const normalizedBase = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const fallbackApiBase = `${normalizedBase || ''}/api`;
const apiBaseUrl = (import.meta.env.VITE_API_URL || fallbackApiBase).replace(/\/$/, '');

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
