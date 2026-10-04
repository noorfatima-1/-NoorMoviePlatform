'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Film,
  Users,
  Eye,
  TrendingUp,
  Plus,
  Trash2,
  BarChart3,
  Clock,
  Pencil,
  Star,
  X,
  ShieldOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { Movie } from '@/types';

interface Stats {
  totalMovies: number;
  featuredMovies: number;
  genres: string[];
}

interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  created_at?: string;
}

type Tab = 'movies' | 'users';

const emptyMovieForm = {
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
};

function movieToForm(movie: Movie) {
  return {
    title: movie.title,
    description: movie.description,
    poster_url: movie.poster_url,
    backdrop_url: movie.backdrop_url || '',
    trailer_url: movie.trailer_url || '',
    release_date: movie.release_date?.split('T')[0] || '',
    duration: String(movie.duration),
    rating: String(movie.rating),
    genre: movie.genre?.join(', ') || '',
    director: movie.director || '',
    cast_members: movie.cast_members?.join(', ') || '',
    language: movie.language || 'English',
    maturity_rating: movie.maturity_rating || 'PG-13',
    is_featured: movie.is_featured,
  };
}

function formToPayload(form: typeof emptyMovieForm) {
  return {
    title: form.title,
    description: form.description,
    poster_url: form.poster_url,
    backdrop_url: form.backdrop_url || form.poster_url,
    trailer_url: form.trailer_url || null,
    release_date: form.release_date,
    duration: parseInt(form.duration),
    rating: parseFloat(form.rating) || 0,
    genre: form.genre.split(',').map((g) => g.trim()).filter(Boolean),
    director: form.director,
    cast_members: form.cast_members.split(',').map((c) => c.trim()).filter(Boolean),
    language: form.language,
    maturity_rating: form.maturity_rating,
    is_featured: form.is_featured,
  };
}

// Shared input classes
const inputCls =
  'bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 placeholder-gray-500 transition-colors';

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMovies: 0, featuredMovies: 0, genres: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('movies');

  // Add movie
  const [showAddForm, setShowAddForm] = useState(false);
  const [movieForm, setMovieForm] = useState(emptyMovieForm);

  // Edit movie
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editForm, setEditForm] = useState(emptyMovieForm);

  // Delete confirmation
  const [deletingMovie, setDeletingMovie] = useState<Movie | null>(null);

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const fetchMovies = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated) fetchMovies();
  }, [isAuthenticated, isLoading, router, fetchMovies]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: AdminUser[] }>('/auth/users');
      setUsers(res.data);
    } catch {
      // endpoint may not exist yet - show placeholder
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab, users.length, fetchUsers]);

  // --- Access denied ---
  if (!isLoading && isAuthenticated && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShieldOff size={64} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-gray-400 mb-8">
            You do not have administrator privileges to access this page.
          </p>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // --- Loading state ---
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- CRUD handlers ---

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/movies', formToPayload(movieForm));
      setShowAddForm(false);
      setMovieForm(emptyMovieForm);
      await fetchMovies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add movie');
    }
  };

  const handleEditMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;
    try {
      await api.put(`/movies/${editingMovie.id}`, formToPayload(editForm));
      setEditingMovie(null);
      await fetchMovies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update movie');
    }
  };

  const handleDeleteMovie = async () => {
    if (!deletingMovie) return;
    try {
      await api.delete(`/movies/${deletingMovie.id}`);
      setDeletingMovie(null);
      await fetchMovies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete movie');
    }
  };

  const handleToggleFeatured = async (movie: Movie) => {
    try {
      await api.put(`/movies/${movie.id}`, { is_featured: !movie.is_featured });
      await fetchMovies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update featured status');
    }
  };

  const openEdit = (movie: Movie) => {
    setEditForm(movieToForm(movie));
    setEditingMovie(movie);
  };

  // --- Movie Form Fields (reused for add & edit) ---
  const renderMovieFormFields = (
    form: typeof emptyMovieForm,
    setForm: (f: typeof emptyMovieForm) => void,
  ) => (
    <>
      <input
        required
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Movie Title *"
        className={inputCls}
      />
      <input
        required
        value={form.director}
        onChange={(e) => setForm({ ...form, director: e.target.value })}
        placeholder="Director *"
        className={inputCls}
      />
      <textarea
        required
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description *"
        rows={2}
        className={`${inputCls} md:col-span-2 resize-none`}
      />
      <input
        required
        value={form.poster_url}
        onChange={(e) => setForm({ ...form, poster_url: e.target.value })}
        placeholder="Poster Image URL *"
        className={inputCls}
      />
      <input
        value={form.backdrop_url}
        onChange={(e) => setForm({ ...form, backdrop_url: e.target.value })}
        placeholder="Backdrop Image URL"
        className={inputCls}
      />
      <input
        value={form.trailer_url}
        onChange={(e) => setForm({ ...form, trailer_url: e.target.value })}
        placeholder="Video / Trailer URL"
        className={inputCls}
      />
      <input
        required
        type="date"
        value={form.release_date}
        onChange={(e) => setForm({ ...form, release_date: e.target.value })}
        className={inputCls}
      />
      <input
        required
        type="number"
        value={form.duration}
        onChange={(e) => setForm({ ...form, duration: e.target.value })}
        placeholder="Duration (minutes) *"
        className={inputCls}
      />
      <input
        type="number"
        step="0.1"
        min="0"
        max="10"
        value={form.rating}
        onChange={(e) => setForm({ ...form, rating: e.target.value })}
        placeholder="Rating (0-10)"
        className={inputCls}
      />
      <input
        value={form.genre}
        onChange={(e) => setForm({ ...form, genre: e.target.value })}
        placeholder="Genres (comma-separated) e.g. Action, Sci-Fi"
        className={inputCls}
      />
      <input
        value={form.cast_members}
        onChange={(e) => setForm({ ...form, cast_members: e.target.value })}
        placeholder="Cast (comma-separated)"
        className={inputCls}
      />
      <select
        value={form.maturity_rating}
        onChange={(e) => setForm({ ...form, maturity_rating: e.target.value })}
        className={inputCls}
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
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            className="w-4 h-4 accent-red-600"
          />
          Featured Movie
        </label>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          {activeTab === 'movies' && (
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setMovieForm(emptyMovieForm);
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add Movie
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-gray-800/50 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('movies')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'movies'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film size={16} />
            Movies
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={16} />
            Users
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

        {/* ===== MOVIES TAB ===== */}
        {activeTab === 'movies' && (
          <>
            {/* Add Movie Form */}
            {showAddForm && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Add New Movie</h2>
                <form onSubmit={handleAddMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderMovieFormFields(movieForm, setMovieForm)}
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
                      <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Actions</th>
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
                          <button
                            onClick={() => handleToggleFeatured(movie)}
                            title={movie.is_featured ? 'Click to unfeature' : 'Click to feature'}
                            className="cursor-pointer"
                          >
                            {movie.is_featured ? (
                              <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full inline-flex items-center gap-1 hover:bg-green-500/30 transition-colors">
                                <Star size={12} />
                                Featured
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full inline-flex items-center gap-1 hover:bg-gray-600 transition-colors">
                                Active
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(movie)}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit movie"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeletingMovie(movie)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete movie"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {movies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-500 py-12">
                          No movies found. Add your first movie above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ===== USERS TAB ===== */}
        {activeTab === 'users' && (
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">User Management</h2>
            </div>
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">User</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Email</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Role</th>
                      <th className="text-left text-gray-400 text-sm font-medium px-6 py-4 hidden md:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium text-sm">
                              {u.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="text-white font-medium">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{u.email}</td>
                        <td className="px-6 py-4">
                          {u.role === 'admin' ? (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                              Admin
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No user data available</p>
                <p className="text-gray-600 text-sm">
                  The <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">GET /auth/users</code> endpoint
                  may not be implemented yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== EDIT MOVIE MODAL ===== */}
      {editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setEditingMovie(null)}
          />
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Edit: {editingMovie.title}
              </h2>
              <button
                onClick={() => setEditingMovie(null)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderMovieFormFields(editForm, setEditForm)}
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMovie(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-8 py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION DIALOG ===== */}
      {deletingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeletingMovie(null)}
          />
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Movie</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">&quot;{deletingMovie.title}&quot;</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDeleteMovie}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeletingMovie(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
