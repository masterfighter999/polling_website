'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import { useRouter } from 'next/navigation';

// Type definitions
interface Option {
    id: number;
    text: string;
    votes: number;
}

interface Poll {
    id: string;
    question: string;
    expiresAt: string | null;
    options: Option[];
}

// Funky Themes with specific color palettes for text and options
const THEMES = [
    { bg: '#D9F99D', text: '#000000', optionBg: '#000000', optionText: '#FFFFFF', secondary: '#84CC16', name: 'Lime' },
    { bg: '#FB923C', text: '#FFFFFF', optionBg: '#431407', optionText: '#FFFFFF', secondary: '#FDBA74', name: 'Orange' },
    { bg: '#F472B6', text: '#000000', optionBg: '#831843', optionText: '#FFFFFF', secondary: '#FBCFE8', name: 'Pink' },
    { bg: '#2DD4BF', text: '#000000', optionBg: '#134E4A', optionText: '#FFFFFF', secondary: '#99F6E4', name: 'Teal' },
    { bg: '#818CF8', text: '#FFFFFF', optionBg: '#312E81', optionText: '#FFFFFF', secondary: '#C7D2FE', name: 'Indigo' },
    { bg: '#F87171', text: '#FFFFFF', optionBg: '#450A0A', optionText: '#FFFFFF', secondary: '#FECACA', name: 'Red' },
    { bg: '#A78BFA', text: '#FFFFFF', optionBg: '#4C1D95', optionText: '#FFFFFF', secondary: '#DDD6FE', name: 'Purple' },
];

const getTheme = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % THEMES.length;
    return THEMES[index]!;
};

let socket: any;

export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [poll, setPoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);
    const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [fingerprint, setFingerprint] = useState('');

    const theme = getTheme(id);

    useEffect(() => {
        let fp = localStorage.getItem('poll_app_fp');
        if (!fp) {
            fp = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('poll_app_fp', fp);
        }
        setFingerprint(fp);

        fetchPoll();

        socket = io('http://localhost:3001');
        socket.emit('join_poll', id);

        socket.on('poll_update', (updatedPoll: any) => {
            if (updatedPoll.id === id) {
                setPoll(prev => prev ? { ...prev, options: updatedPoll.options } : prev);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [id]);

    useEffect(() => {
        const localVote = localStorage.getItem(`voted_${id}`);
        if (localVote) {
            setHasVoted(true);
            setVotedOptionId(Number(localVote));
        }
    }, [id]);

    const fetchPoll = async () => {
        try {
            const { data } = await axios.get(`http://localhost:3001/api/polls/${id}`);
            setPoll(data);
            if (typeof window !== 'undefined') {
                // Check if we voted in this session/browser apart from localStorage
                const voted = localStorage.getItem(`voted_${data.id}`);
                if (voted) {
                    setHasVoted(true);
                    setVotedOptionId(Number(voted));
                }
            }
        } catch (err) {
            console.error(err);
            setError('Poll not found or server error.');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (optionId: number) => {
        try {
            await axios.post(`http://localhost:3001/api/polls/${id}/vote`, {
                optionId,
                voterHash: fingerprint
            });

            setHasVoted(true);
            setVotedOptionId(optionId);
            localStorage.setItem(`voted_${id}`, String(optionId));
        } catch (err: any) {
            if (err.response?.status === 403) {
                setHasVoted(true);
                alert('You have already voted!');
            } else {
                alert('Failed to submit vote');
            }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    if (error || !poll) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;

    const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0B0B0F]">

            <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl items-end md:items-stretch">

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 w-full rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]"
                    style={{ backgroundColor: theme.bg, color: theme.text }}
                >
                    {/* Decorative Circle */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div>
                        <div className="flex justify-between items-start mb-6 opacity-70">
                            <span className="text-sm font-bold uppercase tracking-widest">{hasVoted ? 'Results' : 'Active Poll'}</span>
                            <span className="text-sm font-bold">{totalVotes} Votes</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black leading-tight mb-8 tracking-tight break-words hyphens-auto">
                            {poll.question}
                        </h1>
                    </div>

                    <div className="space-y-3 z-10">
                        {poll.options.map((opt) => {
                            const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                            const isSelected = votedOptionId === opt.id;

                            return (
                                <div key={opt.id} className="relative group">
                                    <button
                                        onClick={() => !hasVoted && handleVote(opt.id)}
                                        disabled={hasVoted}
                                        className="w-full relative overflow-hidden rounded-full py-4 px-8 flex justify-between items-center transition-transform active:scale-95 text-left h-auto min-h-[64px]"
                                        style={{
                                            backgroundColor: theme.optionBg,
                                            color: theme.optionText,
                                            opacity: hasVoted && !isSelected ? 0.7 : 1
                                        }}
                                    >
                                        {/* Progress Bar Background */}
                                        {hasVoted && (
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                className="absolute left-0 top-0 bottom-0 bg-white opacity-20"
                                            />
                                        )}

                                        <span className="font-bold text-lg relative z-10 break-words w-[80%] leading-snug">{opt.text}</span>

                                        {hasVoted && (
                                            <span className="font-bold relative z-10">{percentage}%</span>
                                        )}

                                        {!hasVoted && (
                                            <div className="w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Side Pill (Share) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full md:w-20 rounded-[3rem] p-4 flex md:flex-col justify-between items-center gap-4 shadow-xl border border-white/10 glass"
                    style={{ backgroundColor: '#1A1A1A' }}
                >
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link copied!');
                            }}
                            className="w-12 h-16 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                        </button>
                        <span className="text-xs font-medium">Share</span>
                    </div>

                    <div className="w-full h-[1px] bg-white/10 md:block hidden" />

                    <div className="flex flex-col items-center gap-1 text-gray-500 pb-2">
                        <span className="text-xs">ID</span>
                        <span className="text-[10px] uppercase">{id.substring(0, 4)}</span>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
