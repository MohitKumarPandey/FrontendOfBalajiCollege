import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For demonstration, mock a token since we haven't built login UI yet.
// In a real app, this would get the token from localStorage/Context.
api.interceptors.request.use((config) => {
  // Let's pretend we're the admin for the demo
  const token = localStorage.getItem('token') || 'demo-admin-token';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
