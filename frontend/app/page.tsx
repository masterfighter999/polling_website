'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Funky Themes
const THEMES = [
  { bg: '#D9F99D', text: '#000000', optionBg: '#000000', optionText: '#FFFFFF', secondary: '#84CC16', name: 'Lime' },
  { bg: '#FB923C', text: '#FFFFFF', optionBg: '#431407', optionText: '#FFFFFF', secondary: '#FDBA74', name: 'Orange' },
  { bg: '#F472B6', text: '#000000', optionBg: '#831843', optionText: '#FFFFFF', secondary: '#FBCFE8', name: 'Pink' },
  { bg: '#2DD4BF', text: '#000000', optionBg: '#134E4A', optionText: '#FFFFFF', secondary: '#99F6E4', name: 'Teal' },
  { bg: '#818CF8', text: '#FFFFFF', optionBg: '#312E81', optionText: '#FFFFFF', secondary: '#C7D2FE', name: 'Indigo' },
  { bg: '#F87171', text: '#FFFFFF', optionBg: '#450A0A', optionText: '#FFFFFF', secondary: '#FECACA', name: 'Red' },
  { bg: '#A78BFA', text: '#FFFFFF', optionBg: '#4C1D95', optionText: '#FFFFFF', secondary: '#DDD6FE', name: 'Purple' },
];

export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState(THEMES[0]);

  useEffect(() => {
    // Pick a random theme on mount
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    if (randomTheme) setTheme(randomTheme);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0B0B0F] gap-8">

      <div className="flex flex-col md:flex-row gap-4 w-full max-w-5xl items-end md:items-stretch">

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 w-full rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col justify-center items-center min-h-[500px]"
          style={{ backgroundColor: theme?.bg, color: theme?.text }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl pointer-events-none" />

          <div className="z-10 text-center max-w-2xl relative">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9]">
                POLLING<br />REIMAGINED
              </h1>

              <p className="text-xl md:text-2xl font-medium mb-10 opacity-80 max-w-lg mx-auto">
                Instant, secure, and beautiful real-time polls. No signup required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create" className="w-full sm:w-auto">
                  <button
                    className="w-full sm:w-auto px-10 py-5 rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: theme?.optionBg, color: theme?.optionText }}
                  >
                    Create Poll
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Side Pill (Features) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full md:w-24 rounded-[3rem] p-4 flex md:flex-col justify-between items-center gap-6 shadow-xl border border-white/10 glass bg-[#1A1A1A]"
        >
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
              <span className="text-xl">⚡</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Fast</span>
          </div>

          <div className="w-full h-[1px] bg-white/10 md:block hidden" />

          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
              <span className="text-xl">🔒</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Secure</span>
          </div>

          <div className="w-full h-[1px] bg-white/10 md:block hidden" />

          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
              <span className="text-xl">🎨</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block">Funky</span>
          </div>
        </motion.div>
      </div>

      {/* Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
        {/* Card 1: Live Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-[2.5rem] p-8 min-h-[300px] flex flex-col justify-between relative overflow-hidden group"
          style={{ backgroundColor: THEMES[2].bg, color: THEMES[2].text }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl -mr-8 -mt-8" />

          <div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Example Poll</span>
            <h3 className="text-3xl font-black mt-2 leading-tight break-words">Pineapple on Pizza?</h3>
          </div>

          <div className="space-y-2 mt-4">
            <div className="w-full py-3 px-6 rounded-full font-bold text-sm bg-black/10 flex justify-between">
              <span>Yes! 🍍</span>
              <span>45%</span>
            </div>
            <div className="w-full py-3 px-6 rounded-full font-bold text-sm bg-black/10 flex justify-between opacity-60">
              <span>No way 🤢</span>
              <span>55%</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-[2.5rem] p-8 min-h-[300px] flex flex-col justify-between relative overflow-hidden"
          style={{ backgroundColor: THEMES[5].bg, color: THEMES[5].text }}
        >
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -ml-10 -mb-10" />

          <div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Fairness</span>
            <h3 className="text-3xl font-black mt-2 leading-tight break-words">One Person.<br />One Vote.</h3>
          </div>

          <p className="font-medium opacity-80 text-lg leading-snug">
            We use advanced fingerprinting and IP tracking to ensure your poll results are legitimate.
          </p>
        </motion.div>

        {/* Card 3: Mobile First */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-[2.5rem] p-8 min-h-[300px] flex flex-col justify-between relative overflow-hidden"
          style={{ backgroundColor: THEMES[3].bg, color: THEMES[3].text }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white opacity-20 rounded-full blur-3xl" />

          <div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Design</span>
            <h3 className="text-3xl font-black mt-2 leading-tight break-words">Looks great everywhere.</h3>
          </div>

          <div className="flex gap-2 justify-end">
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-xl">📱</div>
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-xl">💻</div>
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-xl">🖥️</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
