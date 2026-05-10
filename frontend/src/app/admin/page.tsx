'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Film,
  Users,
  Eye,
  TrendingUp,
  Plus,
  Trash2,
  BarChart3,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { Movie } from '@/types';

interface Stats {
  totalMovies: number;
  featuredMovies: number;
  genres: string[];
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMovies: 0, featuredMovies: 0, genres: [] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // New movie form
  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    poster_url: '',
    backdrop_url: '',
    trailer_url: '',
    release_date: '',
    duration: '',
    rating: '',
    genre: '',
    director: '',
    cast_members: '',
    language: 'English',
    maturity_rating: 'PG-13',
    is_featured: false,
  });

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get<{ success: boolean; data: Movie[] }>('/movies?limit=100');
        setMovies(res.data);

        const genreSet = new Set<string>();
        let featured = 0;
        res.data.forEach((m: Movie) => {
          m.genre?.forEach((g: string) => genreSet.add(g));
          if (m.is_featured) featured++;
        });

        setStats({
          totalMovies: res.data.length,
          featuredMovies: featured,
          genres: Array.from(genreSet),
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchData();
  }, [isAuthenticated, isLoading, router]);

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use Supabase directly since this is an admin operation
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('movies').insert({
        title: newMovie.title,
        description: newMovie.description,
        poster_url: newMovie.poster_url,
        backdrop_url: newMovie.backdrop_url || newMovie.poster_url,
        trailer_url: newMovie.trailer_url || null,
        release_date: newMovie.release_date,
        duration: parseInt(newMovie.duration),
        rating: parseFloat(newMovie.rating) || 0,
        genre: newMovie.genre.split(',').map((g) => g.trim()),
        director: newMovie.director,
        cast_members: newMovie.cast_members.split(',').map((c) => c.trim()),
        language: newMovie.language,
        maturity_rating: newMovie.maturity_rating,
        is_featured: newMovie.is_featured,
      });

      if (error) throw error;

      setShowAddForm(false);
      setNewMovie({
        title: '', description: '', poster_url: '', backdrop_url: '',
        trailer_url: '', release_date: '', duration: '', rating: '',
        genre: '', director: '', cast_members: '', language: 'English',
        maturity_rating: 'PG-13', is_featured: false,
      });

      // Refresh list
      const res = await api.get<{ success: boolean; data: Movie[] }>('/movies?limit=100');
      setMovies(res.data);
      setStats((prev) => ({ ...prev, totalMovies: res.data.length }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add movie');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Movie
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Film, label: 'Total Movies', value: stats.totalMovies, color: 'text-blue-500' },
            { icon: TrendingUp, label: 'Featured', value: stats.featuredMovies, color: 'text-green-500' },
            { icon: BarChart3, label: 'Genres', value: stats.genres.length, color: 'text-purple-500' },
            { icon: Eye, label: 'Active', value: movies.length, color: 'text-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={24} className={stat.color} />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Add Movie Form */}
        {showAddForm && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Add New Movie</h2>
            <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                value={newMovie.title}
                onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                placeholder="Movie Title *"
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
              <input
                required
                value={newMovie.director}
                onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
                placeholder="Director *"
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
              <textarea
                required
                value={newMovie.description}
                onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
                placeholder="Description *"
                rows={2}
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500 md:col-span-2 resize-none"
              />
              <input
                required
                value={newMovie.poster_url}
                onChange={(e) => setNewMovie({ ...newMovie, poster_url: e.target.value })}
                placeholder="Poster Image URL *"
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
              <input
                value={newMovie.backdrop_url}
                onChange={(e) => setNewMovie({ ...newMovie, backdrop_url: e.target.value })}
                placeholder="Backdrop Image URL"
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
              <input
                value={newMovie.trailer_url}
                onChange={(e) => setNewMovie({ ...newMovie, trailer_url: e.target.value })}
                placeholder="Video / Trailer URL"
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
              <input
                required
                type="date"
                value={newMovie.release_date}
                onChange={(e) => setNewMovie({ ...newMovie, release_date: e.target.value })}
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500"
              />
              <input
                required
                type="number"
                value={newMovie.duration}
                onChange={(e) => setNewMovie({ ...newMovie, duration: e.target.value })}
                placeholder="Duration (minutes) *"
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
              <input
                value={newMovie.genre}
                onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
                placeholder="Genres (comma-separated) e.g. Action, Sci-Fi"
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
              <input
                value={newMovie.cast_members}
                onChange={(e) => setNewMovie({ ...newMovie, cast_members: e.target.value })}
                placeholder="Cast (comma-separated)"
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500 placeholder-gray-500"
              />
              <select
                value={newMovie.maturity_rating}
                onChange={(e) => setNewMovie({ ...newMovie, maturity_rating: e.target.value })}
                className="bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-gray-500"
              >
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
              </select>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMovie.is_featured}
                    onChange={(e) => setNewMovie({ ...newMovie, is_featured: e.target.checked })}
                    className="w-4 h-4 accent-red-600"
                  />
                  Featured Movie
                </label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
                >
                  Add Movie
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-8 py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Movies Table */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Movie</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4 hidden md:table-cell">Genre</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4 hidden lg:table-cell">Rating</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4 hidden lg:table-cell">Duration</th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div>
                          <p className="text-white font-medium">{movie.title}</p>
                          <p className="text-gray-500 text-sm">{movie.director}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {movie.genre?.slice(0, 2).map((g) => (
                          <span key={g} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-yellow-500 flex items-center gap-1">
                        <Eye size={14} />
                        {movie.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock size={14} />
                        {movie.duration}m
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {movie.is_featured ? (
                        <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
