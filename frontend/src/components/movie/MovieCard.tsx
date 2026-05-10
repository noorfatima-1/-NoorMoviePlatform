'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Plus, ChevronDown, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export default function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { playHover, playClick } = useSound();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] cursor-pointer group"
      onMouseEnter={() => { setIsHovered(true); playHover(); }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => { playClick(); router.push(`/movie/${movie.id}`); }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-800">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 text-sm text-center p-2">
            {movie.title}
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Play Button on Hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 hover:bg-white/30 transition-colors">
              <Play size={32} className="text-white" fill="white" />
            </div>
          </motion.div>
        )}

        {/* Bottom Info on Hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 p-3"
          >
            <h3 className="text-white text-sm font-semibold truncate mb-1">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="text-green-500 font-semibold">
                {Math.round(movie.rating * 20)}%
              </span>
              <span>{movie.maturity_rating}</span>
              <span>{movie.duration}m</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/watch/${movie.id}`);
                }}
                className="bg-white rounded-full p-1.5 hover:bg-gray-200 transition-colors"
              >
                <Play size={14} fill="black" className="text-black" />
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="border border-gray-400 rounded-full p-1.5 hover:border-white transition-colors"
              >
                <Plus size={14} className="text-white" />
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="border border-gray-400 rounded-full p-1.5 hover:border-white transition-colors"
              >
                <ThumbsUp size={14} className="text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/movie/${movie.id}`);
                }}
                className="border border-gray-400 rounded-full p-1.5 hover:border-white transition-colors ml-auto"
              >
                <ChevronDown size={14} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Title (visible when not hovered) */}
      {!isHovered && (
        <h3 className="text-gray-300 text-sm mt-2 truncate">{movie.title}</h3>
      )}
    </motion.div>
  );
}
