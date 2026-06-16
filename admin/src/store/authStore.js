import { create } from 'zustand';
import { apiClient } from '../api/client';

const TOKEN_KEY = 'admin_access_token';
const REFRESH_KEY = 'admin_refresh_token';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      console.log('Attempting login for:', email);
      const res = await apiClient.post('/api/auth/login', { email, password });
      console.log('Login response:', res.data);
      const { accessToken, refreshToken, user } = res.data.data;
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      set({ user, isAuthenticated: true, isLoading: false });
      console.log('Login successful, user:', user);
      return { success: true };
    } catch (err) {
      console.error('Login failed:', err);
      console.error('Error response:', err.response?.data);
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Login failed.' };
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    delete apiClient.defaults.headers.common['Authorization'];
    set({ user: null, isAuthenticated: false });
  },

  restore: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('Auth restore: token exists?', !!token);
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      console.log('Restoring session via /api/auth/me...');
      const res = await apiClient.get('/api/auth/me');
      console.log('Session restored, user:', res.data.data);
      set({ user: res.data.data, isAuthenticated: true });
    } catch (err) {
      console.warn('Token expired, attempting refresh...');
      // Try refreshing
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (refreshToken) {
        try {
          console.log('Refreshing token...');
          const refreshRes = await apiClient.post('/api/auth/refresh', { refreshToken });
          const { accessToken: newToken, refreshToken: newRefresh } = refreshRes.data.data;
          localStorage.setItem(TOKEN_KEY, newToken);
          localStorage.setItem(REFRESH_KEY, newRefresh);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          const meRes = await apiClient.get('/api/auth/me');
          set({ user: meRes.data.data, isAuthenticated: true });
          console.log('Token refreshed successfully');
          return;
        } catch (e) { 
          console.error('Refresh failed:', e);
        }
      }
      console.log('Clearing auth, redirecting to login');
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      set({ isAuthenticated: false });
    }
  },
}));

// Default export for compatibility
export default useAuthStore;
