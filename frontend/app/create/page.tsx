'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';

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

export default function CreatePoll() {
    const router = useRouter();
    const { data: session } = useSession();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [theme, setTheme] = useState(THEMES[0]);

    useEffect(() => {
        // Pick a random theme on mount
        const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
        if (randomTheme) setTheme(randomTheme);
    }, []);

    const addOption = () => {
        if (options.length < 10) setOptions([...options, '']);
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!question.trim()) return setError('Question is required');
        if (options.some(opt => !opt.trim())) return setError('All options must be filled');
        if (options.length < 2) return setError('At least 2 options required');

        setLoading(true);

        try {
            const { data } = await axios.post('http://localhost:3001/api/polls', {
                question,
                options,
                creatorEmail: session?.user?.email
            });
            router.push(`/poll/${data.id}`);
        } catch (err) {
            console.error(err);
            setError('Failed to create poll. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0B0F]">

            <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl items-end md:items-stretch">

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 w-full rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]"
                    style={{ backgroundColor: theme?.bg, color: theme?.text }}
                >
                    {/* Decorative Circle */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between gap-8 z-10 relative">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest opacity-70 mb-2">Create New Poll</h2>
                            <textarea
                                value={question}
                                onChange={(e) => {
                                    setQuestion(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                placeholder="Enter your question?"
                                className="w-full bg-transparent text-4xl md:text-5xl font-black leading-tight placeholder-current focus:outline-none resize-none overflow-hidden"
                                style={{ color: theme?.text }}
                                rows={1}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-black/20 text-sm font-medium text-center backdrop-blur-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <AnimatePresence>
                                {options.map((opt, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative group"
                                    >
                                        <div className="flex items-center w-full relative overflow-hidden rounded-full transition-transform focus-within:scale-[1.02]"
                                            style={{ backgroundColor: theme?.optionBg, color: theme?.optionText }}>

                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => updateOption(i, e.target.value)}
                                                placeholder={`Option ${i + 1}`}
                                                className="w-full bg-transparent py-4 px-8 font-bold text-lg focus:outline-none placeholder-gray-500"
                                                style={{ color: theme?.optionText }}
                                            />

                                            {options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(i)}
                                                    className="pr-6 opacity-50 hover:opacity-100 transition-opacity"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {options.length < 10 && (
                                <button
                                    type="button"
                                    onClick={addOption}
                                    className="w-full py-3 rounded-full border-2 border-dashed border-current opacity-30 hover:opacity-100 transition-all font-bold text-sm uppercase tracking-wider"
                                >
                                    + Add Option
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>

                {/* Side Pill (Actions) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full md:w-20 rounded-[3rem] p-4 flex md:flex-col justify-between items-center gap-4 shadow-xl border border-white/10 glass"
                    style={{ backgroundColor: '#1A1A1A' }}
                >
                    <div className="flex flex-col items-center gap-4 text-gray-400">
                        <button
                            onClick={() => router.push('/')}
                            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                            title="Home"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-12 h-20 rounded-[2rem] flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-black font-bold shadow-lg"
                            style={{ backgroundColor: theme?.secondary }}
                            title="Publish Poll"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
