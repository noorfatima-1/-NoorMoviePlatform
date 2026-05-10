import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getMovies = async (req: Request, res: Response): Promise<void> => {
  const { genre, search, sort, page = '1', limit = '20' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let query = supabaseAdmin.from('movies').select('*', { count: 'exact' });

    if (genre) {
      query = query.contains('genre', [genre as string]);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (sort === 'rating') {
      query = query.order('rating', { ascending: false });
    } else if (sort === 'date') {
      query = query.order('release_date', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch movies' });
  }
};

export const getMovieById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ success: false, error: 'Movie not found' });
      return;
    }

    // Get reviews for this movie
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('*, profiles(username, avatar_url)')
      .eq('movie_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({ success: true, data: { ...data, reviews } });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch movie' });
  }
};

export const getFeaturedMovies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('movies')
      .select('*')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(5);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch featured movies' });
  }
};

export const getMoviesByGenre = async (req: Request, res: Response): Promise<void> => {
  const { genre } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('movies')
      .select('*')
      .contains('genre', [genre])
      .order('rating', { ascending: false })
      .limit(20);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch movies by genre' });
  }
};

export const getTrendingMovies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('movies')
      .select('*')
      .order('rating', { ascending: false })
      .limit(10);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch trending movies' });
  }
};

// Watchlist
export const getWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('watchlist')
      .select('*, movies(*)')
      .eq('user_id', req.user!.id)
      .order('added_at', { ascending: false });

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch watchlist' });
  }
};

export const addToWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { movie_id } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('watchlist')
      .upsert({ user_id: req.user!.id, movie_id })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to add to watchlist' });
  }
};

export const removeFromWatchlist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { movieId } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('watchlist')
      .delete()
      .eq('user_id', req.user!.id)
      .eq('movie_id', movieId);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, message: 'Removed from watchlist' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to remove from watchlist' });
  }
};

// Reviews
export const addReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { movie_id, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .upsert(
        { user_id: req.user!.id, movie_id, rating, comment },
        { onConflict: 'user_id,movie_id' }
      )
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.status(201).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to add review' });
  }
};

// Watch History
export const updateWatchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { movie_id, progress, duration } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('watch_history')
      .upsert(
        {
          user_id: req.user!.id,
          movie_id,
          progress,
          duration,
          watched_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,movie_id' }
      )
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update watch history' });
  }
};

export const getWatchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('watch_history')
      .select('*, movies(*)')
      .eq('user_id', req.user!.id)
      .order('watched_at', { ascending: false })
      .limit(20);

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch watch history' });
  }
};
