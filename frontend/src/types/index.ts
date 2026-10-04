export interface Movie {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url?: string;
  video_url?: string;
  release_date: string;
  duration: number;
  rating: number;
  genre: string[];
  director: string;
  cast_members: string[];
  language: string;
  maturity_rating: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  reviews?: Review[];
  similar?: Movie[];
  tmdb_id?: number;
  vote_count?: number;
  popularity?: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  role: 'user' | 'admin';
}

export interface Review {
  id: string;
  user_id: string;
  movie_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    session: Session;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'party_invite' | 'review' | 'system';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'premium' | 'family';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
