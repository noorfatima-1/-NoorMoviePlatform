'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Clock, Heart, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, loadUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { icon: User, label: 'Account', description: 'Manage your account settings' },
    { icon: Heart, label: 'My List', description: 'Movies you\'ve saved to watch later' },
    { icon: Clock, label: 'Watch History', description: 'Recently watched movies' },
    { icon: Settings, label: 'Settings', description: 'App preferences and notifications' },
  ];

  return (
    <div className="min-h-screen bg-[#141414] pt-24 px-4 sm:px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-12">
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-4xl font-bold">
            {user.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{user.username}</h1>
            <p className="text-gray-400 mt-1">{user.email}</p>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-4 bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800 hover:border-gray-600 transition-all text-left group"
            >
              <div className="p-3 bg-gray-700/50 rounded-lg group-hover:bg-red-600/20 transition-colors">
                <item.icon size={24} className="text-gray-400 group-hover:text-red-500 transition-colors" />
              </div>
              <div>
                <h3 className="text-white font-medium">{item.label}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="flex items-center gap-3 text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign out of NoorMoviePlatform</span>
        </button>
      </div>
    </div>
  );
}
