import { create } from 'zustand';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Notification, ApiResponse } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  _channel: RealtimeChannel | null;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToRealtime: (userId: string) => void;
  unsubscribe: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  _channel: null,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<Notification[]>>('/notifications');
      set({ notifications: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      set({ unreadCount: res.data.count });
    } catch {
      // silently fail
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all', {});
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently fail
    }
  },

  subscribeToRealtime: (userId: string) => {
    const existing = get()._channel;
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        }
      )
      .subscribe();

    set({ _channel: channel });
  },

  unsubscribe: () => {
    const channel = get()._channel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ _channel: null });
    }
  },
}));
