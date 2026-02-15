import express from 'express';
import http from 'http';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// NOTE: Removed process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
// The Aiven CA is loaded in db/index.ts and passed via ssl.ca with rejectUnauthorized: true

import { initializeDatabase } from './db/init';
import { initializeSocket } from './socket';
import pollRoutes from './routes/polls';

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
}));

app.use(express.json());

// Rate limiter for vote endpoint (anti-abuse layer)
const voteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,             // max 20 vote attempts per minute per IP
    message: { error: 'Too many vote attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────
// Register voteLimiter BEFORE pollRoutes so it runs for /api/polls/:id/vote
app.use('/api/polls/:id/vote', voteLimiter);
app.use('/api/polls', pollRoutes);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────────────
async function start() {
    try {
        // Initialize database tables
        await initializeDatabase();

        // Initialize Socket.IO
        initializeSocket(server, CORS_ORIGIN);

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Backend server running on http://0.0.0.0:${PORT}`);
            console.log(`📡 Socket.IO ready for real-time updates`);
            console.log(`🔗 CORS enabled for: ${CORS_ORIGIN}\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
