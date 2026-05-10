'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { useMovieStore } from '@/store/movieStore';
import MovieCard from '@/components/movie/MovieCard';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const { movies, searchMovies, fetchByGenre, isLoading } = useMovieStore();
  const [searchInput, setSearchInput] = useState(query);
  const [genreMovies, setGenreMovies] = useState<typeof movies>([]);

  useEffect(() => {
    if (query) {
      searchMovies(query);
      setSearchInput(query);
    }
  }, [query, searchMovies]);

  useEffect(() => {
    if (genre) {
      fetchByGenre(genre).then(setGenreMovies);
    }
  }, [genre, fetchByGenre]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchMovies(searchInput.trim());
    }
  };

  const displayMovies = genre ? genreMovies : movies;
  const title = genre ? `${genre} Movies` : query ? `Results for "${query}"` : 'Search Movies';

  return (
    <div className="min-h-screen bg-[#141414] pt-24 px-4 sm:px-6 lg:px-12">
      <div className="max-w-[1920px] mx-auto">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl">
            <SearchIcon
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for movies, genres, people..."
              className="w-full bg-gray-800 border border-gray-700 text-white text-lg rounded-lg pl-12 pr-4 py-4 focus:outline-none focus:border-gray-500 placeholder-gray-500 transition-colors"
            />
          </div>
        </form>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">{title}</h1>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
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
