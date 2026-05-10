import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.TMDB_API_KEY!;
const BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  adult: boolean;
  popularity: number;
  runtime?: number;
  genres?: { id: number; name: string }[];
  credits?: {
    cast: { name: string; character: string; profile_path: string | null; order: number }[];
    crew: { name: string; job: string }[];
  };
  videos?: {
    results: { key: string; site: string; type: string }[];
  };
}

interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

// Genre ID to name mapping
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  return res.json() as Promise<T>;
}

function transformMovie(movie: TMDBMovie) {
  return {
    id: `tmdb-${movie.id}`,
    tmdb_id: movie.id,
    title: movie.title,
    description: movie.overview,
    poster_url: movie.poster_path ? `${IMG_BASE}/w500${movie.poster_path}` : '',
    backdrop_url: movie.backdrop_path ? `${IMG_BASE}/original${movie.backdrop_path}` : '',
    trailer_url: (() => {
      const videos = movie.videos?.results?.filter((v) => v.site === 'YouTube') || [];
      const trailer = videos.find((v) => v.type === 'Trailer')
        || videos.find((v) => v.type === 'Teaser')
        || videos[0];
      return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    })(),
    release_date: movie.release_date || '2024-01-01',
    duration: movie.runtime || 120,
    rating: Math.round((movie.vote_average / 2) * 10) / 10, // Convert 10-scale to 5-scale
    genre: movie.genre_ids
      ? movie.genre_ids.map((id) => GENRE_MAP[id] || 'Other').filter(Boolean)
      : movie.genres
        ? movie.genres.map((g) => g.name)
        : [],
    director: movie.credits?.crew?.find((c) => c.job === 'Director')?.name || 'Unknown',
    cast_members: movie.credits?.cast?.slice(0, 5).map((c) => c.name) || [],
    language: movie.original_language === 'en' ? 'English' : movie.original_language.toUpperCase(),
    maturity_rating: movie.adult ? 'R' : 'PG-13',
    is_featured: movie.popularity > 100,
    vote_count: movie.vote_count,
    popularity: movie.popularity,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const tmdb = {
  async getTrending(page = '1') {
    const data = await tmdbFetch<TMDBResponse>('/trending/movie/week', { page });
    return {
      movies: data.results.map(transformMovie),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  },

  async getNowPlaying(page = '1') {
    const data = await tmdbFetch<TMDBResponse>('/movie/now_playing', { page, region: 'US' });
    return {
      movies: data.results.map(transformMovie),
      page: data.page,
      totalPages: data.total_pages,
    };
  },

  async getTopRated(page = '1') {
    const data = await tmdbFetch<TMDBResponse>('/movie/top_rated', { page });
    return {
      movies: data.results.map(transformMovie),
      page: data.page,
      totalPages: data.total_pages,
    };
  },

  async getUpcoming(page = '1') {
    const data = await tmdbFetch<TMDBResponse>('/movie/upcoming', { page, region: 'US' });
    return {
      movies: data.results.map(transformMovie),
      page: data.page,
      totalPages: data.total_pages,
    };
  },

  async getPopular(page = '1') {
    const data = await tmdbFetch<TMDBResponse>('/movie/popular', { page });
    return {
      movies: data.results.map(transformMovie),
      page: data.page,
      totalPages: data.total_pages,
    };
  },

  async getMovieDetails(tmdbId: string) {
    const movie = await tmdbFetch<TMDBMovie>(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos',
    });
    return transformMovie(movie);
  },

  async searchMovies(query: string, page = '1') {
    const data = await tmdbFetch<TMDBResponse>('/search/movie', { query, page });
    return {
      movies: data.results.map(transformMovie),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  },

  async getByGenre(genreId: string, page = '1') {
    const data = await tmdbFetch<TMDBResponse>('/discover/movie', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page,
    });
    return {
      movies: data.results.map(transformMovie),
      page: data.page,
      totalPages: data.total_pages,
    };
  },

  async getSimilar(tmdbId: string) {
    const data = await tmdbFetch<TMDBResponse>(`/movie/${tmdbId}/similar`);
    return data.results.map(transformMovie);
  },

  // Genre name to TMDB ID
  getGenreId(name: string): string | null {
    const entry = Object.entries(GENRE_MAP).find(([, v]) => v.toLowerCase() === name.toLowerCase());
    return entry ? entry[0] : null;
  },
};
