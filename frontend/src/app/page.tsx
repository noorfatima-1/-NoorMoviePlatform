'use client';

import { useEffect, useState, useCallback } from 'react';
import HeroSection from '@/components/movie/HeroSection';
import MovieRow from '@/components/movie/MovieRow';
import IntroSplash from '@/components/shared/IntroSplash';
import { useMovieStore } from '@/store/movieStore';
import { useAuthStore } from '@/store/authStore';
import type { Movie } from '@/types';

const GENRES = ['Action', 'Comedy', 'Horror', 'Romance', 'Animation', 'Documentary', 'War'];

export default function HomePage() {
  const {
    featuredMovies,
    trendingMovies,
    nowPlayingMovies,
    topRatedMovies,
    upcomingMovies,
    popularMovies,
    fetchFeatured,
    fetchTrending,
    fetchNowPlaying,
    fetchTopRated,
    fetchUpcoming,
    fetchPopular,
    fetchByGenre,
  } = useMovieStore();
  const { loadUser } = useAuthStore();
  const [genreMovies, setGenreMovies] = useState<Record<string, Movie[]>>({});
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem('noor_intro_seen');
    if (seen) setShowIntro(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        loadUser(),
        fetchFeatured(),
        fetchTrending(),
        fetchNowPlaying(),
        fetchTopRated(),
        fetchUpcoming(),
        fetchPopular(),
      ]);

      const genreResults: Record<string, Movie[]> = {};
      await Promise.all(
        GENRES.map(async (genre) => {
          const movies = await fetchByGenre(genre);
          if (movies.length > 0) {
            genreResults[genre] = movies;
          }
        })
      );
      setGenreMovies(genreResults);
      setLoading(false);
    };

    init();
  }, [loadUser, fetchFeatured, fetchTrending, fetchNowPlaying, fetchTopRated, fetchUpcoming, fetchPopular, fetchByGenre]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    sessionStorage.setItem('noor_intro_seen', 'true');
  }, []);

  if (showIntro) {
    return <IntroSplash onComplete={handleIntroComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-lg">Loading NoorMoviePlatform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Hero */}
      {featuredMovies.length > 0 && <HeroSection movies={featuredMovies} />}

      {/* Movie Rows */}
      <div className="-mt-20 relative z-10 pb-10">
        {trendingMovies.length > 0 && (
          <MovieRow title="Trending Now" movies={trendingMovies} />
        )}

        {nowPlayingMovies.length > 0 && (
          <MovieRow title="Now Playing in Theaters" movies={nowPlayingMovies} />
        )}

        {popularMovies.length > 0 && (
          <MovieRow title="Popular on NoorMoviePlatform" movies={popularMovies} />
        )}

        {topRatedMovies.length > 0 && (
          <MovieRow title="Top Rated" movies={topRatedMovies} />
        )}

        {upcomingMovies.length > 0 && (
          <MovieRow title="Coming Soon" movies={upcomingMovies} />
        )}

        {Object.entries(genreMovies).map(([genre, movies]) => (
          <MovieRow key={genre} title={genre} movies={movies} />
        ))}
      </div>
    </div>
  );
}
