'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, History } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function HistoryPage() {
  const { user, isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const { watchHistory, fetchWatchHistory } = useUserStore();
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
      fetchWatchHistory();
    }
  }, [isAuthenticated, fetchWatchHistory]);

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
            <h1 className="text-3xl font-bold text-white">Watch History</h1>
            <p className="text-gray-400 mt-1">{watchHistory.length} movie{watchHistory.length !== 1 ? 's' : ''} watched</p>
          </div>
        </div>

        {/* Empty State */}
        {watchHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <History size={64} className="text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No watch history yet</h2>
            <p className="text-gray-400">Movies you watch will appear here.</p>
          </div>
        )}

        {/* History Grid */}
        {watchHistory.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchHistory.map((item) => {
              const movie = item.movies;
              const progressPercent = item.duration > 0 ? Math.min((item.progress / item.duration) * 100, 100) : 0;

              return (
                <div
                  key={item.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all group cursor-pointer"
                  onClick={() => router.push(`/movie/${movie.id}`)}
                >
                  {/* Poster */}
                  <div className="relative aspect-[2/3]">
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />

                    {/* Progress Bar Overlay */}
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className="h-1 bg-gray-700">
                        <div
                          className="h-full bg-red-600 transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-white text-sm font-medium truncate">
                      {movie.title}
                    </h3>

                    {/* Progress Text */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-gray-500 text-xs">
                        {formatDuration(item.progress)} / {formatDuration(item.duration)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>

                    {/* Watched At */}
                    <div className="flex items-center gap-1 mt-2 text-gray-500">
                      <Clock size={10} />
                      <span className="text-[10px]">{formatRelativeTime(item.watched_at)}</span>
                    </div>
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
