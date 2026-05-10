import { Router } from 'express';
import {
  getMovies,
  getMovieById,
  getFeaturedMovies,
  getMoviesByGenre,
  getTrendingMovies,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  addReview,
  updateWatchHistory,
  getWatchHistory,
} from '../controllers/movieController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getMovies);
router.get('/featured', getFeaturedMovies);
router.get('/trending', getTrendingMovies);
router.get('/genre/:genre', getMoviesByGenre);
router.get('/:id', getMovieById);

// Protected routes
router.get('/user/watchlist', authenticate, getWatchlist);
router.post('/user/watchlist', authenticate, addToWatchlist);
router.delete('/user/watchlist/:movieId', authenticate, removeFromWatchlist);
router.post('/user/review', authenticate, addReview);
router.post('/user/history', authenticate, updateWatchHistory);
router.get('/user/history', authenticate, getWatchHistory);

export default router;
