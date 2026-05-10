'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function WatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentMovie, fetchMovieById } = useMovieStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (video) video.paused ? video.play() : video.pause();
          setShowControls(true);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (video) video.currentTime = Math.max(0, video.currentTime - 10);
          setShowControls(true);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (video) video.currentTime += 10;
          setShowControls(true);
          break;
        case 'm':
          if (video) video.muted = !video.muted;
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
  }, [isFullscreen, router]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  }, []);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pct * duration;
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    setShowControls(true);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const videoUrl =
    currentMovie?.trailer_url ||
    currentMovie?.video_url ||
    '';

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const isYouTube = !!youtubeId;

  if (!currentMovie) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // YouTube embed — use iframe for instant playback
  if (isYouTube) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 bg-black z-50"
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeft size={28} />
              </button>
              <div>
                <h1 className="text-white text-lg font-semibold">{currentMovie.title}</h1>
                <p className="text-gray-400 text-sm">{currentMovie.genre?.join(' / ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/watch-party?movie=${currentMovie.id}`)}
                className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <Users size={16} />
                Watch Party
              </button>
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* YouTube iframe */}
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&color=red`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </div>
    );
  }

  // Native video player for direct MP4 URLs
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50"
      onMouseMove={() => setShowControls(true)}
    >
      {/* Video */}
      <div className="absolute inset-0" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            setReady(true);
          }}
          onTimeUpdate={(e) => {
            const ct = e.currentTarget.currentTime;
            const dur = e.currentTarget.duration || 1;
            setCurrentTime(ct);
            setPlayed(ct / dur);
            setIsPlaying(!e.currentTarget.paused);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { setIsPlaying(false); setShowControls(true); }}
        />
      </div>

      {/* Loading */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading {currentMovie.title}...</p>
          </div>
        </div>
      )}

      {/* Center Play icon */}
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
          onClick={handleSeek}
        >
          <div
            className="absolute h-full bg-red-600 rounded-full transition-all"
            style={{ width: `${played * 100}%` }}
          />
          <div
            className="absolute top-1/2 w-4 h-4 bg-red-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${played * 100}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors">
              {isPlaying ? <Pause size={28} /> : <Play size={28} fill="white" />}
            </button>
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10; }}
              className="text-white hover:text-gray-300 transition-colors hidden sm:block"
            >
              <SkipBack size={22} />
            </button>
            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10; }}
              className="text-white hover:text-gray-300 transition-colors hidden sm:block"
            >
              <SkipForward size={22} />
            </button>

            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.muted = !muted;
                  setMuted(!muted);
                }}
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
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  setMuted(false);
                  if (videoRef.current) {
                    videoRef.current.volume = v;
                    videoRef.current.muted = false;
                  }
                }}
                className="w-0 group-hover/vol:w-20 transition-all duration-300 accent-red-600 cursor-pointer"
              />
            </div>

            <span className="text-white text-sm tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors">
              {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
