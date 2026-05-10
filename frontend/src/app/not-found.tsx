'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-8xl sm:text-9xl font-black text-red-600 mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Lost your way?</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Sorry, we can&apos;t find that page. You&apos;ll find lots to explore on the home page.
        </p>
        <Link
          href="/"
          className="inline-block bg-white text-black font-bold px-8 py-3 rounded-md hover:bg-gray-200 transition-colors text-lg"
        >
          NoorMoviePlatform Home
        </Link>
      </motion.div>
    </div>
  );
}
