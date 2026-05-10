'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [phase, setPhase] = useState<'logo' | 'done'>('logo');
  const { playIntro } = useSound();

  useEffect(() => {
    // Small delay then play sound
    const soundTimer = setTimeout(() => {
      playIntro();
    }, 300);

    // End splash after animation
    const endTimer = setTimeout(() => {
      setPhase('done');
    }, 2800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(soundTimer);
      clearTimeout(endTimer);
      clearTimeout(completeTimer);
    };
  }, [playIntro, onComplete]);

  return (
    <AnimatePresence>
      {phase === 'logo' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        >
          {/* Background glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.3, scale: 1.5 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute w-96 h-96 bg-red-600 rounded-full blur-[120px]"
          />

          {/* Logo Text */}
          <motion.div className="relative z-10 text-center">
            <motion.h1
              initial={{ opacity: 0, scale: 0.3, letterSpacing: '0.5em' }}
              animate={{
                opacity: 1,
                scale: 1,
                letterSpacing: '0.15em',
              }}
              transition={{
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.2,
              }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-red-600 to-red-800"
              style={{
                textShadow: '0 0 40px rgba(239, 68, 68, 0.5), 0 0 80px rgba(239, 68, 68, 0.3)',
              }}
            >
              NOOR
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-gray-400 text-lg sm:text-xl tracking-[0.3em] mt-2"
            >
              MOVIE PLATFORM
            </motion.p>

            {/* Underline sweep */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 1.2, ease: 'easeInOut' }}
              className="h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent mt-4 origin-center"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
