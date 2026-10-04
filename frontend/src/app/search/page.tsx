'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useMovieStore } from '@/store/movieStore';
import MovieCard from '@/components/movie/MovieCard';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import type { Movie } from '@/types';

const ALL_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western',
];

const YEARS = ['2024', '2023', '2022', '2021', '2020', '2019', '2018'];
const RATINGS = ['9+', '8+', '7+', '6+', '5+'];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const { movies, searchMovies, fetchByGenre, isLoading } = useMovieStore();
  const [searchInput, setSearchInput] = useState(query);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(genre ? [genre] : []);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (query) {
      searchMovies(query);
      setSearchInput(query);
    }
  }, [query, searchMovies]);

  useEffect(() => {
    if (genre) {
      fetchByGenre(genre).then(setGenreMovies);
      setSelectedGenres([genre]);
    }
  }, [genre, fetchByGenre]);

  // Apply local filters
  const applyFilters = useCallback((source: Movie[]) => {
    let result = [...source];

    if (selectedYear) {
      result = result.filter((m) => m.release_date?.startsWith(selectedYear));
    }

    if (selectedRating) {
      const minRating = parseInt(selectedRating) / 2; // convert from 10-scale to 5-scale
      result = result.filter((m) => m.rating >= minRating);
    }

    return result;
  }, [selectedYear, selectedRating]);

  useEffect(() => {
    const source = genre ? genreMovies : movies;
    setFilteredMovies(applyFilters(source));
  }, [movies, genreMovies, genre, applyFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleGenreClick = (g: string) => {
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter((x) => x !== g));
      if (g === genre) router.push('/search');
    } else {
      setSelectedGenres([g]);
      router.push(`/search?genre=${encodeURIComponent(g)}`);
    }
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedYear('');
    setSelectedRating('');
    router.push('/search');
  };

  const hasFilters = selectedGenres.length > 0 || selectedYear || selectedRating;
  const displayMovies = filteredMovies;
  const title = genre ? `${genre} Movies` : query ? `Results for "${query}"` : 'Explore Movies';

  return (
    <div className="min-h-screen bg-[#141414] pt-24 px-4 sm:px-6 lg:px-12">
      <div className="max-w-[1920px] mx-auto">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-2xl flex gap-3">
            <div className="relative flex-1">
              <SearchIcon
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for movies, genres, people..."
                className="w-full bg-gray-800 border border-gray-700 text-white text-lg rounded-lg pl-12 pr-4 py-4 focus:outline-none focus:border-red-500 placeholder-gray-500 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {(selectedGenres.length > 0 ? 1 : 0) + (selectedYear ? 1 : 0) + (selectedRating ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Filter size={18} />
                Filters
              </h3>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>

            {/* Genre Tags */}
            <div className="mb-5">
              <p className="text-gray-400 text-sm mb-2">Genre</p>
              <div className="flex flex-wrap gap-2">
                {ALL_GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGenreClick(g)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedGenres.includes(g)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Year & Rating */}
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-2">Release Year</p>
                <div className="flex gap-2 flex-wrap">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(selectedYear === y ? '' : y)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedYear === y
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Minimum Rating</p>
                <div className="flex gap-2 flex-wrap">
                  {RATINGS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRating(selectedRating === r ? '' : r)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedRating === r
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">{title}</h1>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayMovies.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <SearchIcon size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">
              {query ? `No results found for "${query}"` : 'Start searching for movies'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-red-500 hover:text-red-400 underline"
              >
                Clear filters and try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#141414] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
