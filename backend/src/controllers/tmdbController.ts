import { Request, Response } from 'express';
import { tmdb } from '../services/tmdbService';

export const getTrending = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1' } = req.query;
    const data = await tmdb.getTrending(page as string);
    res.json({ success: true, data: data.movies, pagination: { page: data.page, totalPages: data.totalPages } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch trending movies' });
  }
};

export const getNowPlaying = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1' } = req.query;
    const data = await tmdb.getNowPlaying(page as string);
    res.json({ success: true, data: data.movies, pagination: { page: data.page, totalPages: data.totalPages } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch now playing movies' });
  }
};

export const getTopRated = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1' } = req.query;
    const data = await tmdb.getTopRated(page as string);
    res.json({ success: true, data: data.movies, pagination: { page: data.page, totalPages: data.totalPages } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch top rated movies' });
  }
};

export const getUpcoming = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1' } = req.query;
    const data = await tmdb.getUpcoming(page as string);
    res.json({ success: true, data: data.movies, pagination: { page: data.page, totalPages: data.totalPages } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming movies' });
  }
};

export const getPopular = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1' } = req.query;
    const data = await tmdb.getPopular(page as string);
    res.json({ success: true, data: data.movies, pagination: { page: data.page, totalPages: data.totalPages } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch popular movies' });
  }
};

export const getMovieDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const skipSimilar = req.query.light === 'true';
    const [movie, similar] = await Promise.all([
      tmdb.getMovieDetails(id),
      skipSimilar ? Promise.resolve([]) : tmdb.getSimilar(id),
    ]);
    res.json({ success: true, data: { ...movie, similar } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch movie details' });
  }
};

export const searchTMDB = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, page = '1' } = req.query;
    if (!query) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }
    const data = await tmdb.searchMovies(String(query), String(page));
    res.json({ success: true, data: data.movies, pagination: { page: data.page, totalPages: data.totalPages, totalResults: data.totalResults } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to search movies' });
  }
};

export const getByGenre = async (req: Request, res: Response): Promise<void> => {
  try {
    const genre = String(req.params.genre);
    const { page = '1' } = req.query;
    const genreId = tmdb.getGenreId(genre);
    if (!genreId) {
      res.status(400).json({ success: false, error: 'Invalid genre' });
      return;
    }
    const data = await tmdb.getByGenre(genreId, String(page));
    res.json({ success: true, data: data.movies, pagination: { page: data.page, totalPages: data.totalPages } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch movies by genre' });
  }
};
