'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Globe, Shield, CreditCard, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const router = useRouter();

  const [language, setLanguage] = useState('en');
  const [maturityFilter, setMaturityFilter] = useState('PG-13');

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] pt-24 px-4 sm:px-6 lg:px-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account and preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-700/50 rounded-lg">
                <User size={20} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Account</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Username</label>
                <input
                  type="text"
                  value={user.username}
                  readOnly
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gray-600 cursor-not-allowed opacity-75"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gray-600 cursor-not-allowed opacity-75"
                />
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-700/50 rounded-lg">
                <Globe size={20} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Preferences</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600 appearance-none cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Maturity Filter</label>
                <select
                  value={maturityFilter}
                  onChange={(e) => setMaturityFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600 appearance-none cursor-pointer"
                >
                  <option value="G">G - General Audiences</option>
                  <option value="PG">PG - Parental Guidance</option>
                  <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                  <option value="R">R - Restricted</option>
                  <option value="NC-17">NC-17 - Adults Only</option>
                </select>
              </div>
            </div>
          </section>

          {/* Subscription Section */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-700/50 rounded-lg">
                <CreditCard size={20} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Subscription</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Current Plan</p>
                <p className="text-gray-400 text-sm mt-0.5 capitalize">Free</p>
              </div>
              <button
                onClick={() => router.push('/subscription')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-gray-800/50 border border-red-900/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-900/20 rounded-lg">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Delete Account</p>
                <p className="text-gray-400 text-sm mt-0.5">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => alert('Account deletion is not yet available. Please contact support.')}
                className="px-4 py-2 bg-transparent border border-red-600 text-red-500 hover:bg-red-600 hover:text-white text-sm font-medium rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
