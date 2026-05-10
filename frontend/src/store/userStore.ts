import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Movie } from '@/types';

interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: string;
  added_at: string;
  movies: Movie;
}

interface HistoryItem {
  id: string;
  user_id: string;
  movie_id: string;
  progress: number;
  duration: number;
  watched_at: string;
  movies: Movie;
}

interface UserState {
  watchlist: WatchlistItem[];
  watchHistory: HistoryItem[];
  watchlistIds: Set<string>;
  isLoadingWatchlist: boolean;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (movieId: string) => Promise<void>;
  removeFromWatchlist: (movieId: string) => Promise<void>;
  isInWatchlist: (movieId: string) => boolean;
  fetchWatchHistory: () => Promise<void>;
  updateWatchProgress: (movieId: string, progress: number, duration: number) => Promise<void>;
  submitReview: (movieId: string, rating: number, comment: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  watchlist: [],
  watchHistory: [],
  watchlistIds: new Set(),
  isLoadingWatchlist: false,

  fetchWatchlist: async () => {
    set({ isLoadingWatchlist: true });
    try {
      const res = await api.get<{ success: boolean; data: WatchlistItem[] }>('/movies/user/watchlist');
      const ids = new Set(res.data.map((item) => item.movie_id));
      set({ watchlist: res.data, watchlistIds: ids, isLoadingWatchlist: false });
    } catch {
      set({ isLoadingWatchlist: false });
    }
  },

  addToWatchlist: async (movieId) => {
    try {
      await api.post('/movies/user/watchlist', { movie_id: movieId });
      const newIds = new Set(get().watchlistIds);
      newIds.add(movieId);
      set({ watchlistIds: newIds });
      get().fetchWatchlist();
    } catch {
      // silent
    }
  },

  removeFromWatchlist: async (movieId) => {
    try {
      await api.delete(`/movies/user/watchlist/${movieId}`);
      const newIds = new Set(get().watchlistIds);
      newIds.delete(movieId);
      set({ watchlistIds: newIds });
      set({ watchlist: get().watchlist.filter((w) => w.movie_id !== movieId) });
    } catch {
      // silent
    }
  },

  isInWatchlist: (movieId) => get().watchlistIds.has(movieId),

  fetchWatchHistory: async () => {
    try {
      const res = await api.get<{ success: boolean; data: HistoryItem[] }>('/movies/user/history');
      set({ watchHistory: res.data });
    } catch {
      // silent
    }
  },

  updateWatchProgress: async (movieId, progress, duration) => {
    try {
      await api.post('/movies/user/history', { movie_id: movieId, progress, duration });
    } catch {
      // silent
    }
  },

  submitReview: async (movieId, rating, comment) => {
    await api.post('/movies/user/review', { movie_id: movieId, rating, comment });
  },
}));
