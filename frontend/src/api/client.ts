import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Интерцептор: добавляем JWT из localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('daylog_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор: при 401 — очищаем токен и редиректим на /login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('daylog_token');
      localStorage.removeItem('daylog_actor');
      // Не редиректим, если уже на /login или /share
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/share')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
