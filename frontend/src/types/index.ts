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
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
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
