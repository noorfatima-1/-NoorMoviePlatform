'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Users,
} from 'lucide-react';
import { useMovieStore } from '@/store/movieStore';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface ProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentMovie, fetchMovieById } = useMovieStore();

  const [isPlaying, setIsPlaying] = useState(true);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Use light mode - skip similar movies fetch for faster loading
    if (id) fetchMovieById(id as string, true);
  }, [id, fetchMovieById]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying((p) => !p);
          setShowControls(true);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playerRef.current?.seekTo(Math.max(0, playedSeconds - 10));
          setShowControls(true);
          break;
        case 'ArrowRight':
          e.preventDefault();
          playerRef.current?.seekTo(playedSeconds + 10);
          setShowControls(true);
          break;
        case 'm':
          setMuted((m) => !m);
          setShowControls(true);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) document.exitFullscreen?.();
          else router.back();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [playedSeconds, isFullscreen, router]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  }, []);

  const handleProgress = (state: ProgressState) => {
    if (!seeking) {
      setPlayed(state.played);
      setPlayedSeconds(state.playedSeconds);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setPlayed(pct);
    playerRef.current?.seekTo(pct);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // If we have a YouTube trailer URL, use it (loads instantly)
  // Otherwise fall back to a fast-loading sample
  const videoUrl =
    currentMovie?.trailer_url ||
    currentMovie?.video_url ||
    `https://www.youtube.com/watch?v=dQw4w9WgXcQ`;

  if (!currentMovie) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Video Player */}
      <div className="absolute inset-0" onClick={() => { setIsPlaying(!isPlaying); setShowControls(true); }}>
        <ReactPlayer
          ref={(p) => { playerRef.current = p; }}
          url={videoUrl}
          playing={isPlaying}
          volume={volume}
          muted={muted}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          onProgress={handleProgress}
          onDuration={(d: number) => setDuration(d)}
          onReady={() => setReady(true)}
          onEnded={() => { setIsPlaying(false); setShowControls(true); }}
          onBuffer={() => {}}
          config={{
            file: {
              attributes: {
                crossOrigin: 'anonymous',
              },
            },
          }}
        />
      </div>

      {/* Loading indicator */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading {currentMovie.title}...</p>
          </div>
        </div>
      )}

      {/* Center Play/Pause indicator */}
      {!isPlaying && ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-6">
            <Play size={48} className="text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent z-20 transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); router.back(); }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={28} />
            </button>
            <div>
              <h1 className="text-white text-lg font-semibold">{currentMovie.title}</h1>
              <p className="text-gray-400 text-sm">{currentMovie.genre?.join(' / ')}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/watch-party?movie=${currentMovie.id}`); }}
            className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Users size={16} />
            Watch Party
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 transition-opacity duration-500 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-1.5 bg-gray-600/60 rounded-full mb-4 cursor-pointer group relative"
          onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
          onMouseDown={() => setSeeking(true)}
          onMouseUp={() => setSeeking(false)}
        >
          {/* Loaded buffer */}
          <div
            className="absolute h-full bg-gray-500/50 rounded-full"
            style={{ width: `${played * 100 + 10}%`, maxWidth: '100%' }}
          />
          {/* Played */}
          <div
            className="absolute h-full bg-red-600 rounded-full transition-all"
            style={{ width: `${played * 100}%` }}
          />
          {/* Scrubber dot */}
          <div
            className="absolute top-1/2 w-4 h-4 bg-red-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${played * 100}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} fill="white" />}
            </button>
            <button
              onClick={() => playerRef.current?.seekTo(Math.max(0, playedSeconds - 10))}
              className="text-white hover:text-gray-300 transition-colors hidden sm:block"
            >
              <SkipBack size={22} />
            </button>
            <button
              onClick={() => playerRef.current?.seekTo(playedSeconds + 10)}
              className="text-white hover:text-gray-300 transition-colors hidden sm:block"
            >
              <SkipForward size={22} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={() => setMuted(!muted)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {muted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                className="w-0 group-hover/vol:w-20 transition-all duration-300 accent-red-600 cursor-pointer"
              />
            </div>

            <span className="text-white text-sm tabular-nums">
              {formatTime(playedSeconds)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
