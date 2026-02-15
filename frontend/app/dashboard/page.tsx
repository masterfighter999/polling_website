'use client';

import { useSession } from "next-auth/react";
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mock Data for "My Polls"
const MOCK_POLLS = [
    { id: '1', question: 'Favorite Framework?', votes: 1240, status: 'Active', color: '#D9F99D', textColor: '#000000' },
    { id: '2', question: 'Tabs or Spaces?', votes: 856, status: 'Ended', color: '#FB923C', textColor: '#FFFFFF' },
    { id: '3', question: 'Pizza Toppings?', votes: 2300, status: 'Active', color: '#F472B6', textColor: '#000000' },
];

export default function Dashboard() {
    const { data: session } = useSession();
    const router = useRouter();

    if (!session) {
        // Ideally redirect or show loading, but for now let's show a "Not logged in" state
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
                    className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-[#1A1A1A] border border-white/10 glass relative overflow-hidden"
                >
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                    <div className="flex items-center gap-6 z-10">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7C5CFF] to-[#00D1FF] flex items-center justify-center text-3xl font-black border-4 border-white/10 shadow-xl overflow-hidden">
                                {session.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.classList.remove('bg-transparent');
                                        }}
                                    />
                                ) : (
                                    <span>{session.user?.name?.[0] || 'U'}</span>
                                )}
                                {/* Fallback text if image fails to load (img will hide itself) */}
                                {session.user?.image && (
                                    <span className="absolute z-[-1]">{session.user?.name?.[0] || 'U'}</span>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1A1A1A]" />
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{session.user?.name}</h1>
                            <p className="text-gray-400 font-medium">{session.user?.email}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 z-10">
                        <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <div className="text-2xl font-bold">12</div>
                            <div className="text-xs uppercase tracking-wider text-gray-500 font-bold">Polls Created</div>
                        </div>
                        <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                            <div className="text-2xl font-bold">4.5k</div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_POLLS.map((poll, i) => (
                        <motion.div
                            key={poll.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative p-6 rounded-[2rem] min-h-[200px] flex flex-col justify-between cursor-pointer hover:shadow-2xl transition-all hover:scale-[1.02]"
                            style={{ backgroundColor: poll.color, color: poll.textColor }}
                        >
                            <div className="flex justify-between items-start">
                                <span className="px-3 py-1 rounded-full bg-black/10 text-xs font-bold uppercase tracking-wide backdrop-blur-sm">
                                    {poll.status}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    ↗
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black leading-tight mb-2">{poll.question}</h3>
                                <p className="font-bold opacity-70">{poll.votes.toLocaleString()} votes</p>
                            </div>
                        </motion.div>
                    ))}

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

            </div>
        </div>
    );
}
