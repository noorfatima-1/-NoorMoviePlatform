'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Info, CheckCircle, AlertTriangle, PartyPopper, Star, Settings } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import type { Notification } from '@/types';
import { clsx } from 'clsx';

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'success':
      return <CheckCircle size={16} className="text-green-400" />;
    case 'warning':
      return <AlertTriangle size={16} className="text-yellow-400" />;
    case 'party_invite':
      return <PartyPopper size={16} className="text-purple-400" />;
    case 'review':
      return <Star size={16} className="text-orange-400" />;
    case 'system':
      return <Settings size={16} className="text-gray-400" />;
    case 'info':
    default:
      return <Info size={16} className="text-blue-400" />;
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    subscribeToRealtime,
    unsubscribe,
  } = useNotificationStore();

  // Fetch unread count on mount and subscribe to realtime
  useEffect(() => {
    fetchUnreadCount();

    if (user?.id) {
      subscribeToRealtime(user.id);
    }

    return () => {
      unsubscribe();
    };
  }, [user?.id, fetchUnreadCount, subscribeToRealtime, unsubscribe]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative text-gray-300 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-black/95 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[480px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-red-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={clsx(
                    'w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-800/60 transition-colors border-b border-gray-800 last:border-b-0',
                    notification.is_read ? 'bg-transparent' : 'bg-white/5'
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={clsx(
                          'text-sm font-medium truncate',
                          notification.is_read ? 'text-gray-400' : 'text-white'
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                      )}
                    </div>
                    <p
                      className={clsx(
                        'text-xs mt-0.5 line-clamp-2',
                        notification.is_read ? 'text-gray-500' : 'text-gray-300'
                      )}
                    >
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {getRelativeTime(notification.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
