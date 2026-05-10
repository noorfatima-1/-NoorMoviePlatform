export interface Movie {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url?: string;
  video_url?: string;
  release_date: string;
  duration: number; // minutes
  rating: number;
  genre: string[];
  director: string;
  cast_members: string[];
  language: string;
  maturity_rating: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  movie_id: string;
  added_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  movie_id: string;
  progress: number; // seconds watched
  duration: number;
  watched_at: string;
}

export interface WatchParty {
  id: string;
  host_id: string;
  movie_id: string;
  room_code: string;
  is_active: boolean;
  playback_time: number;
  is_playing: boolean;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
