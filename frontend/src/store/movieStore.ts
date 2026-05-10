import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Movie, ApiResponse } from '@/types';

interface MovieState {
  movies: Movie[];
  featuredMovies: Movie[];
  trendingMovies: Movie[];
  nowPlayingMovies: Movie[];
  topRatedMovies: Movie[];
  upcomingMovies: Movie[];
  popularMovies: Movie[];
  currentMovie: (Movie & { similar?: Movie[] }) | null;
  isLoading: boolean;
  searchQuery: string;
  fetchFeatured: () => Promise<void>;
  fetchTrending: () => Promise<void>;
  fetchNowPlaying: () => Promise<void>;
  fetchTopRated: () => Promise<void>;
  fetchUpcoming: () => Promise<void>;
  fetchPopular: () => Promise<void>;
  fetchMovieById: (id: string, light?: boolean) => Promise<void>;
  fetchByGenre: (genre: string) => Promise<Movie[]>;
  searchMovies: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

export const useMovieStore = create<MovieState>((set) => ({
  movies: [],
  featuredMovies: [],
  trendingMovies: [],
  nowPlayingMovies: [],
  topRatedMovies: [],
  upcomingMovies: [],
  popularMovies: [],
  currentMovie: null,
  isLoading: false,
  searchQuery: '',

  fetchFeatured: async () => {
    try {
      // Use TMDB trending as featured (hero section)
      const res = await api.get<ApiResponse<Movie[]>>('/tmdb/trending');
      set({ featuredMovies: res.data.slice(0, 5) });
    } catch {
      // fallback to supabase
      try {
        const res = await api.get<ApiResponse<Movie[]>>('/movies/featured');
        set({ featuredMovies: res.data });
      } catch { /* silent */ }
    }
  },

  fetchTrending: async () => {
    try {
      const res = await api.get<ApiResponse<Movie[]>>('/tmdb/trending');
      set({ trendingMovies: res.data });
    } catch { /* silent */ }
  },

  fetchNowPlaying: async () => {
    try {
      const res = await api.get<ApiResponse<Movie[]>>('/tmdb/now-playing');
      set({ nowPlayingMovies: res.data });
    } catch { /* silent */ }
  },

  fetchTopRated: async () => {
    try {
      const res = await api.get<ApiResponse<Movie[]>>('/tmdb/top-rated');
      set({ topRatedMovies: res.data });
    } catch { /* silent */ }
  },

  fetchUpcoming: async () => {
    try {
      const res = await api.get<ApiResponse<Movie[]>>('/tmdb/upcoming');
      set({ upcomingMovies: res.data });
    } catch { /* silent */ }
  },

  fetchPopular: async () => {
    try {
      const res = await api.get<ApiResponse<Movie[]>>('/tmdb/popular');
      set({ popularMovies: res.data });
    } catch { /* silent */ }
  },

  fetchMovieById: async (id, light = false) => {
    set({ isLoading: true });
    try {
      if (id.startsWith('tmdb-')) {
        const tmdbId = id.replace('tmdb-', '');
        const query = light ? '?light=true' : '';
        const res = await api.get<ApiResponse<Movie & { similar?: Movie[] }>>(`/tmdb/${tmdbId}${query}`);
        set({ currentMovie: res.data, isLoading: false });
      } else {
        const res = await api.get<ApiResponse<Movie>>(`/movies/${id}`);
        set({ currentMovie: res.data, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  fetchByGenre: async (genre) => {
    try {
      const res = await api.get<ApiResponse<Movie[]>>(`/tmdb/genre/${genre}`);
      return res.data;
    } catch {
      return [];
    }
  },

  searchMovies: async (query) => {
    set({ isLoading: true, searchQuery: query });
    try {
      const res = await api.get<ApiResponse<Movie[]>>(`/tmdb/search?query=${encodeURIComponent(query)}`);
      set({ movies: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
