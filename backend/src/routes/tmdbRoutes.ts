import { Router } from 'express';
import {
  getTrending,
  getNowPlaying,
  getTopRated,
  getUpcoming,
  getPopular,
  getMovieDetails,
  searchTMDB,
  getByGenre,
} from '../controllers/tmdbController';

const router = Router();

router.get('/trending', getTrending);
router.get('/now-playing', getNowPlaying);
router.get('/top-rated', getTopRated);
router.get('/upcoming', getUpcoming);
router.get('/popular', getPopular);
router.get('/search', searchTMDB);
router.get('/genre/:genre', getByGenre);
router.get('/:id', getMovieDetails);

export default router;
