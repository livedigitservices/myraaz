import axios from 'axios';

// Strip trailing slashes and collapse accidental "//api" into "/api"
const cleanBase = (url) =>
  String(url || '')
    .trim()
    .replace(/([^:])\/{2,}/g, '$1/')
    .replace(/\/+$/, '');

const api = axios.create({
  baseURL: cleanBase(import.meta.env.VITE_API_URL) || 'https://myraaz.onrender.com/api',
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle 401 globally — clear stale auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('userInfo');
        // Avoid redirect loops on the login page itself
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;