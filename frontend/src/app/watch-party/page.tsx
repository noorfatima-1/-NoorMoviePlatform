'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  Users,
  Copy,
  Check,
  Send,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useMovieStore } from '@/store/movieStore';
import { api } from '@/lib/api';
import type { Movie } from '@/types';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

interface PartyData {
  id: string;
  room_code: string;
  movie_id: string;
  host_id: string;
  is_active: boolean;
  playback_time: number;
  is_playing: boolean;
  movies?: Movie;
  members?: Array<{ profiles: { username: string; avatar_url: string } }>;
}

function WatchPartyContent() {
  const searchParams = useSearchParams();
  const movieId = searchParams.get('movie');
  const joinCode = searchParams.get('join');
  const router = useRouter();
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const { currentMovie, fetchMovieById } = useMovieStore();

  const playerRef = useRef<HTMLIFrameElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const [party, setParty] = useState<PartyData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const isHost = party?.host_id === user?.id;

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // Create or join party
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const init = async () => {
      try {
        if (joinCode) {
          const res = await api.post<{ success: boolean; data: PartyData }>('/watch-party/join', {
            room_code: joinCode,
          });
          setParty(res.data);
          if (res.data.movie_id) fetchMovieById(res.data.movie_id);
          if (res.data.members) {
            setMembers(res.data.members.map((m) => m.profiles?.username || 'User'));
          }
        } else if (movieId) {
          fetchMovieById(movieId);
          const res = await api.post<{ success: boolean; data: PartyData }>('/watch-party/create', {
            movie_id: movieId,
          });
          setParty(res.data);
          setMembers([user.username]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to setup watch party');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isAuthenticated, user, movieId, joinCode, fetchMovieById]);

  // Load existing messages
  useEffect(() => {
    if (!party?.id) return;

    api.get<{ success: boolean; data: ChatMessage[] }>(`/watch-party/${party.id}/messages`)
      .then((res) => setChatMessages(res.data))
      .catch(() => {});
  }, [party?.id]);

  // Subscribe to realtime: party state + chat messages
  useEffect(() => {
    if (!party?.id) return;

    const channel = supabase
      .channel(`party-${party.id}`)
      // Party state updates (playback sync)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'watch_parties', filter: `id=eq.${party.id}` },
        (payload) => {
          const updated = payload.new as PartyData;
          if (!isHost) {
            setIsPlaying(updated.is_playing);
            if (Math.abs(updated.playback_time - playedSeconds) > 2) {
              setPlayedSeconds(updated.playback_time);
            }
          }
        }
      )
      // New chat messages
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'watch_party_messages', filter: `party_id=eq.${party.id}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => {
            chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
          }, 100);
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [party?.id, isHost, playedSeconds]);

  // Sync playback state (host only)
  useEffect(() => {
    if (!isHost || !party?.id) return;

    const interval = setInterval(async () => {
      try {
        await api.put(`/watch-party/${party.id}/state`, {
          playback_time: playedSeconds,
          is_playing: isPlaying,
        });
      } catch {
        // silent
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isHost, party?.id, playedSeconds, isPlaying]);

  const copyRoomCode = () => {
    if (party?.room_code) {
      navigator.clipboard.writeText(party.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !party?.id) return;

    const message = chatInput.trim();
    setChatInput('');

    try {
      await api.post(`/watch-party/${party.id}/messages`, { message });
    } catch {
      // Message will appear via realtime subscription
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return `${Math.floor(diff / 3600000)}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="text-white underline">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Extract YouTube video ID for iframe embed
  const videoUrl = currentMovie?.trailer_url || currentMovie?.video_url || '';
  const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  const youtubeId = ytMatch ? ytMatch[1] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row h-[calc(100vh-64px)]">
        {/* Video Section */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 bg-black/50">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="text-white hover:text-gray-300">
                <ArrowLeft size={22} />
              </button>
              <h1 className="text-white font-semibold">{currentMovie?.title || 'Watch Party'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Wifi size={14} className={connected ? 'text-green-500' : 'text-red-500'} />
                <span className={`text-xs ${connected ? 'text-green-500' : 'text-red-500'}`}>
                  {connected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                <span className="text-gray-400 text-sm">Room:</span>
                <span className="text-white font-mono font-bold">{party?.room_code}</span>
                <button onClick={copyRoomCode} className="text-gray-400 hover:text-white ml-1">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Users size={16} />
                <span>{members.length}</span>
              </div>
            </div>
          </div>

          {/* Video */}
          <div className="flex-1 relative bg-black">
            {youtubeId ? (
              <iframe
                ref={playerRef}
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isPlaying ? 1 : 0}&mute=${muted ? 1 : 0}&enablejsapi=1`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoUrl ? (
              <video
                className="absolute inset-0 w-full h-full object-contain"
                src={videoUrl}
                muted={muted}
                onTimeUpdate={(e) => setPlayedSeconds(e.currentTarget.currentTime)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                No video available
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="bg-gray-900 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:text-gray-300"
                  disabled={!isHost}
                  title={isHost ? '' : 'Only the host can control playback'}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
                </button>
                <button onClick={() => setMuted(!muted)} className="text-white hover:text-gray-300">
                  {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <span className="text-gray-400 text-sm tabular-nums">
                  {formatTime(playedSeconds)} / {formatTime(duration)}
                </span>
              </div>
              {!isHost && (
                <span className="text-yellow-500 text-xs">Host controls playback</span>
              )}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-[360px] flex flex-col bg-gray-900/80 border-l border-gray-800">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Users size={18} />
              Watch Party Chat
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {members.map((m, i) => (
                <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {chatMessages.length === 0 && (
              <p className="text-gray-500 text-sm text-center mt-8">
                No messages yet. Start chatting!
              </p>
            )}
            {chatMessages.map((msg) => {
              const username = msg.profiles?.username || 'User';
              return (
                <div key={msg.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-medium ${msg.user_id === user?.id ? 'text-red-400' : 'text-white'}`}>
                        {username}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {getRelativeTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form onSubmit={sendChat} className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function WatchPartyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#141414] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WatchPartyContent />
    </Suspense>
  );
}
