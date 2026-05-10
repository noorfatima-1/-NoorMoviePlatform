'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Movie } from '@/types';

interface HeroSectionProps {
  movies: Movie[];
}

export default function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const router = useRouter();
  const movie = movies[currentIndex];

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (!movie) return null;

  return (
    <div className="relative w-full h-[85vh] lg:h-[90vh] overflow-hidden">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${movie.backdrop_url})` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-2xl"
            >
              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                {movie.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-3 mb-4 text-sm">
                <span className="text-green-500 font-semibold">
                  {Math.round(movie.rating * 20)}% Match
                </span>
                <span className="text-gray-400">{new Date(movie.release_date).getFullYear()}</span>
                <span className="border border-gray-500 text-gray-400 px-1.5 py-0.5 text-xs">
                  {movie.maturity_rating}
                </span>
                <span className="text-gray-400">{movie.duration} min</span>
              </div>

              {/* Description */}
              <p className="text-base lg:text-lg text-gray-200 mb-6 line-clamp-3 leading-relaxed">
                {movie.description}
              </p>

              {/* Genre Tags */}
              <div className="flex items-center gap-2 mb-8">
                {movie.genre.map((g) => (
                  <span
                    key={g}
                    className="text-xs text-gray-300 bg-white/10 px-3 py-1 rounded-full"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/watch/${movie.id}`)}
                  className="flex items-center gap-2 bg-white text-black font-bold px-8 py-3 rounded-md hover:bg-gray-200 transition-colors text-lg"
                >
                  <Play size={24} fill="black" />
                  Play
                </button>
                <button
                  onClick={() => router.push(`/movie/${movie.id}`)}
                  className="flex items-center gap-2 bg-gray-500/60 text-white font-bold px-8 py-3 rounded-md hover:bg-gray-500/80 transition-colors text-lg"
                >
                  <Info size={24} />
                  More Info
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-20 right-12 flex items-center gap-4">
        <button
          onClick={() => setMuted(!muted)}
          className="border border-gray-400 rounded-full p-2 text-white hover:bg-white/10 transition-colors"
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <span className="bg-gray-800/80 border-l-2 border-white text-white text-sm px-4 py-1.5">
          {movie.maturity_rating}
        </span>
      </div>

      {/* Slide Indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === currentIndex ? 'w-8 bg-white' : 'w-4 bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
