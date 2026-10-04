'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Crown, Users, Zap, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { Subscription } from '@/types';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Browse all movies',
      'Watch trailers',
      'Create watchlist',
      'Basic search',
    ],
    icon: Zap,
    color: 'gray',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    features: [
      'Everything in Free',
      'Unlimited streaming',
      'HD & 4K quality',
      'Watch parties',
      'No ads',
      'Download for offline',
    ],
    icon: Crown,
    color: 'red',
    popular: true,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$14.99',
    period: '/month',
    features: [
      'Everything in Premium',
      'Up to 5 profiles',
      'Parental controls',
      'Simultaneous streams',
      'Priority support',
    ],
    icon: Users,
    color: 'purple',
  },
];

export default function SubscriptionPage() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      api.get<{ success: boolean; data: Subscription }>('/subscriptions')
        .then((res) => setCurrentPlan(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return;
    setActionLoading(planId);
    try {
      const res = await api.post<{ success: boolean; data: Subscription }>('/subscriptions/checkout', { plan: planId });
      setCurrentPlan(res.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    setActionLoading('cancel');
    try {
      const res = await api.post<{ success: boolean; data: Subscription }>('/subscriptions/cancel', {});
      setCurrentPlan(res.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activePlan = currentPlan?.plan || 'free';

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 px-4 sm:px-6 lg:px-12 pb-12">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Choose Your Plan</h1>
          <p className="text-gray-400 text-lg">Unlock the full NoorMoviePlatform experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isActive = activePlan === plan.id;
            const isPremium = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  isPremium
                    ? 'border-red-500 bg-red-500/5'
                    : 'border-gray-700 bg-gray-800/30'
                } ${isActive ? 'ring-2 ring-red-500' : ''}`}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                {isActive && (
                  <div className="absolute -top-3 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Current Plan
                  </div>
                )}

                <div className="mb-6">
                  <plan.icon size={28} className={`mb-3 ${isPremium ? 'text-red-500' : 'text-gray-400'}`} />
                  <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check size={16} className="text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isActive ? (
                  plan.id !== 'free' ? (
                    <button
                      onClick={handleCancel}
                      disabled={actionLoading === 'cancel'}
                      className="w-full py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === 'cancel' ? 'Canceling...' : 'Cancel Plan'}
                    </button>
                  ) : (
                    <div className="w-full py-3 rounded-lg bg-gray-700 text-center text-gray-400">
                      Current Plan
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={actionLoading === plan.id || plan.id === 'free'}
                    className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      isPremium
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : plan.id === 'free'
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {actionLoading === plan.id ? 'Processing...' : plan.id === 'free' ? 'Free Forever' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
