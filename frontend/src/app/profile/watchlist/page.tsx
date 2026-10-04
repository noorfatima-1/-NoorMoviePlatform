'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Trash2, BookmarkX } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

export default function WatchlistPage() {
  const { user, isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const { watchlist, isLoadingWatchlist, fetchWatchlist, removeFromWatchlist } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchlist();
    }
  }, [isAuthenticated, fetchWatchlist]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] pt-24 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
            <p className="text-gray-400 mt-1">{watchlist.length} movie{watchlist.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>

        {/* Loading */}
        {isLoadingWatchlist && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoadingWatchlist && watchlist.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookmarkX size={64} className="text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h2>
            <p className="text-gray-400">Start adding movies!</p>
          </div>
        )}

        {/* Movie Grid */}
        {!isLoadingWatchlist && watchlist.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchlist.map((item) => {
              const movie = item.movies;
              return (
                <div
                  key={item.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all group"
                >
                  {/* Poster */}
                  <div
                    className="relative aspect-[2/3] cursor-pointer"
                    onClick={() => router.push(`/movie/${movie.id}`)}
                  >
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3
                      className="text-white text-sm font-medium truncate cursor-pointer hover:text-red-500 transition-colors"
                      onClick={() => router.push(`/movie/${movie.id}`)}
                    >
                      {movie.title}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-400 text-xs">{movie.rating?.toFixed(1) || 'N/A'}</span>
                    </div>

                    {/* Genres */}
                    {movie.genre && movie.genre.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.genre.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromWatchlist(movie.id)}
                      className="flex items-center gap-1.5 mt-3 w-full justify-center py-1.5 text-xs text-gray-400 hover:text-red-500 bg-gray-700/30 hover:bg-red-600/10 rounded transition-all"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
