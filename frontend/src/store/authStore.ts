import { create } from 'zustand';
import { api } from '@/lib/api';
import type { User, AuthResponse } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('access_token', res.data.session.access_token);
    set({ user: res.data.user, isAuthenticated: true });
  },

  signup: async (email, password, username) => {
    const res = await api.post<AuthResponse>('/auth/signup', { email, password, username });
    localStorage.setItem('access_token', res.data.session.access_token);
    set({ user: res.data.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: User }>('/auth/profile');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ isLoading: false });
    }
  },
}));
