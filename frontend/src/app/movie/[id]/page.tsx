'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Plus, Check, ThumbsUp, Share2, Star, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMovieStore } from '@/store/movieStore';
import { useUserStore } from '@/store/userStore';
import { useAuthStore } from '@/store/authStore';
import { useSound } from '@/hooks/useSound';
import StarRating from '@/components/ui/StarRating';
import MovieRow from '@/components/movie/MovieRow';
import type { Movie } from '@/types';

export default function MovieDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentMovie, fetchMovieById, fetchByGenre, isLoading } = useMovieStore();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, fetchWatchlist, submitReview } = useUserStore();
  const { isAuthenticated } = useAuthStore();
  const { playClick } = useSound();
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMovieById(id as string);
      if (isAuthenticated) fetchWatchlist();
    }
  }, [id, fetchMovieById, isAuthenticated, fetchWatchlist]);

  useEffect(() => {
    const loadSimilar = async () => {
      // Use similar movies from TMDB response if available
      if ((currentMovie as any)?.similar?.length) {
        setSimilarMovies((currentMovie as any).similar);
      } else if (currentMovie?.genre?.[0]) {
        const movies = await fetchByGenre(currentMovie.genre[0]);
        setSimilarMovies(movies.filter((m) => m.id !== currentMovie.id));
      }
    };
    loadSimilar();
  }, [currentMovie, fetchByGenre]);

  const handleWatchlistToggle = () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    playClick();
    if (isInWatchlist(movie.id)) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie.id);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (userRating === 0) return;
    try {
      await submitReview(movie.id, userRating, reviewComment);
      setReviewSubmitted(true);
      fetchMovieById(movie.id);
    } catch {
      // silent
    }
  };

  const handleShare = async () => {
    playClick();
    if (navigator.share) {
      await navigator.share({ title: movie.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading || !currentMovie) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const movie = currentMovie;
  const inWatchlist = isInWatchlist(movie.id);

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Backdrop */}
      <div className="relative w-full h-[70vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.backdrop_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/40" />

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-12">
          <div className="max-w-[1920px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                {movie.title}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => { playClick(); router.push(`/watch/${movie.id}`); }}
                  className="flex items-center gap-2 bg-white text-black font-bold px-8 py-3 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Play size={20} fill="black" />
                  Play
                </button>
                <button
                  onClick={handleWatchlistToggle}
                  className={`border-2 rounded-full p-3 transition-colors ${
                    inWatchlist
                      ? 'border-green-500 text-green-500 bg-green-500/10'
                      : 'border-gray-400 text-white hover:border-white'
                  }`}
                  title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
                >
                  {inWatchlist ? <Check size={20} /> : <Plus size={20} />}
                </button>
                <button
                  onClick={() => { playClick(); setLiked(!liked); }}
                  className={`border-2 rounded-full p-3 transition-colors ${
                    liked
                      ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                      : 'border-gray-400 text-white hover:border-white'
                  }`}
                >
                  <ThumbsUp size={20} />
                </button>
                <button
                  onClick={handleShare}
                  className="border-2 border-gray-400 rounded-full p-3 hover:border-white text-white transition-colors"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Movie Details */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className="text-green-500 font-bold text-lg">
                {Math.round(movie.rating * 20)}% Match
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Calendar size={16} />
                {new Date(movie.release_date).getFullYear()}
              </span>
              <span className="border border-gray-500 text-gray-400 px-2 py-0.5 text-sm">
                {movie.maturity_rating}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Clock size={16} />
                {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
              </span>
              <span className="flex items-center gap-1 text-yellow-500">
                <Star size={16} fill="currentColor" />
                {movie.rating}/5
              </span>
            </div>

            <p className="text-gray-200 text-lg leading-relaxed mb-6">
              {movie.description}
            </p>

            {/* Rate this movie */}
            {isAuthenticated && (
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mb-8">
                <h3 className="text-white font-semibold mb-3">Rate this movie</h3>
                {reviewSubmitted ? (
                  <p className="text-green-500">Thanks for your review!</p>
                ) : (
                  <div className="space-y-3">
                    <StarRating rating={userRating} onRate={setUserRating} size={28} />
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your review (optional)..."
                      rows={3}
                      className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500 resize-none"
                    />
                    <button
                      onClick={handleSubmitReview}
                      disabled={userRating === 0}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-gray-500 text-sm">Director: </span>
              <span className="text-gray-200">{movie.director}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Cast: </span>
              <span className="text-gray-200">{movie.cast_members?.join(', ')}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Genres: </span>
              <span className="text-gray-200">{movie.genre?.join(', ')}</span>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Language: </span>
              <span className="text-gray-200">{movie.language}</span>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {movie.reviews && movie.reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
            <div className="space-y-4">
              {movie.reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                      {review.profiles?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-white font-medium">
                      {review.profiles?.username || 'Anonymous'}
                    </span>
                    <StarRating rating={review.rating} readonly size={14} />
                  </div>
                  <p className="text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {similarMovies.length > 0 && (
          <div className="mt-12">
            <MovieRow title="More Like This" movies={similarMovies} />
          </div>
        )}
      </div>
    </div>
  );
}
