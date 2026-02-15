'use client';

import { useSession } from "next-auth/react";
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Funky Themes (matching poll page)
const THEMES = [
    { bg: '#D9F99D', text: '#000000', secondary: '#84CC16', name: 'Lime' },
    { bg: '#FB923C', text: '#FFFFFF', secondary: '#FDBA74', name: 'Orange' },
    { bg: '#F472B6', text: '#000000', secondary: '#FBCFE8', name: 'Pink' },
    { bg: '#2DD4BF', text: '#000000', secondary: '#99F6E4', name: 'Teal' },
    { bg: '#818CF8', text: '#FFFFFF', secondary: '#C7D2FE', name: 'Indigo' },
    { bg: '#F87171', text: '#FFFFFF', secondary: '#FECACA', name: 'Red' },
    { bg: '#A78BFA', text: '#FFFFFF', secondary: '#DDD6FE', name: 'Purple' },
];

const getTheme = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % THEMES.length;
    return THEMES[index]!;
};

interface Poll {
    id: string;
    question: string;
    votes: number;
    status: string;
    created_at: string;
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.email) {
            fetchPolls(session.user.email);
        }
    }, [session]);

    const fetchPolls = async (email: string) => {
        try {
            const { data } = await axios.get(`${API_URL}/api/polls/user?email=${email}`);
            setPolls(data);
        } catch (error) {
            console.error('Failed to fetch polls', error);
        } finally {
            setLoading(false);
        }
    };

    const deletePoll = async (e: React.MouseEvent, pollId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this poll?')) return;
        try {
            await axios.delete(`${API_URL}/api/polls/${pollId}`);
            setPolls(polls.filter(p => p.id !== pollId));
        } catch (error) {
            console.error('Failed to delete poll', error);
            alert('Failed to delete poll');
        }
    };

    // Show loading placeholder while session is being fetched
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white">
                <div className="text-center text-gray-400">Loading...</div>
            </div>
        );
    }

    // Show sign-in prompt only when confirmed unauthenticated
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                    <Link href="/" className="text-blue-400 hover:underline">Go Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-white p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header / Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-[#1A1A1A] border border-white/10 glass relative overflow-hidden"
                >
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-center gap-6 z-10 text-center md:text-left">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#00D1FF] flex items-center justify-center text-3xl font-black border-4 border-white/10 shadow-xl overflow-hidden">
                                {session?.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.classList.remove('bg-transparent');
                                        }}
                                    />
                                ) : (
                                    <span>{session?.user?.name?.[0] || 'U'}</span>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1A1A1A]" />
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{session?.user?.name}</h1>
                            <p className="text-gray-400 font-medium">{session?.user?.email}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 z-10 w-full md:w-auto justify-center">
                        <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <div className="text-2xl font-bold">{polls.length}</div>
                            <div className="text-xs uppercase tracking-wider text-gray-500 font-bold">Polls Created</div>
                        </div>
                        <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <div className="text-2xl font-bold">
                                {polls.reduce((acc, curr) => acc + curr.votes, 0)}
                            </div>
                            <div className="text-xs uppercase tracking-wider text-gray-500 font-bold">Total Votes</div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Bar */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">My Polls</h2>
                    <Link href="/create">
                        <button className="px-6 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform active:scale-95">
                            + New Poll
                        </button>
                    </Link>
                </div>

                {/* Polls Grid */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading polls...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {polls.map((poll, i) => {
                            const theme = getTheme(poll.id);
                            return (
                                <Link href={`/poll/${poll.id}`} key={poll.id} className="group cursor-pointer">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="group relative p-6 rounded-[2rem] min-h-[200px] flex flex-col justify-between hover:shadow-2xl transition-all hover:scale-[1.02]"
                                        style={{ backgroundColor: theme.bg, color: theme.text }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="px-3 py-1 rounded-full bg-black/10 text-xs font-bold uppercase tracking-wide backdrop-blur-sm">
                                                {poll.status}
                                            </span>
                                            <button
                                                onClick={(e) => deletePoll(e, poll.id)}
                                                className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80 hover:scale-110"
                                                title="Delete poll"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-black leading-tight mb-2 line-clamp-2">{poll.question}</h3>
                                            <p className="font-bold opacity-70">{poll.votes} votes</p>
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}

                        {/* Create New / Placeholder Card */}
                        <Link href="/create" className="group">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="h-full rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 min-h-[200px] hover:bg-white/5 transition-colors text-gray-500 group-hover:text-white"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                    +
                                </div>
                                <span className="font-bold">Create New Poll</span>
                            </motion.div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
