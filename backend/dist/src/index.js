"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Allow all for MVP, restrict in prod
        methods: ['GET', 'POST']
    }
});
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic health check
app.get('/', (req, res) => {
    res.send('Polling App Backend is running');
});
// API Routes
// Create Poll
app.post('/api/polls', async (req, res) => {
    try {
        const { question, options, expiresAt } = req.body;
        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            res.status(400).json({ error: 'Question and at least 2 options are required' });
            return;
        }
        const poll = await prisma.poll.create({
            data: {
                question,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                options: {
                    create: options.map((opt) => ({ text: opt }))
                }
            },
            include: { options: true }
        });
        res.json(poll);
    }
    catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ error: 'Failed to create poll' });
    }
});
// Get Poll
app.get('/api/polls/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const poll = await prisma.poll.findUnique({
            where: { id },
            include: {
                options: {
                    include: { votes: true } // Include votes for count
                }
            }
        });
        if (!poll) {
            res.status(404).json({ error: 'Poll not found' });
            return;
        }
        // Transform data to send only vote counts, not individual vote records (privacy)
        const sanitizedPoll = {
            ...poll,
            options: poll.options.map(opt => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes.length
            }))
        };
        res.json(sanitizedPoll);
    }
    catch (error) {
        console.error('Error fetching poll:', error);
        res.status(500).json({ error: 'Failed to fetch poll' });
    }
});
// Vote
app.post('/api/polls/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { optionId, voterHash } = req.body;
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        if (!optionId || !voterHash) {
            res.status(400).json({ error: 'Option ID and voter hash are required' });
            return;
        }
        // Check if poll exists
        const poll = await prisma.poll.findUnique({ where: { id } });
        if (!poll) {
            res.status(404).json({ error: 'Poll not found' });
            return;
        }
        // Fairness check: strict unique constraint handling via try/catch P2002
        try {
            const vote = await prisma.vote.create({
                data: {
                    pollId: id,
                    optionId: Number(optionId),
                    ipAddress: String(ipAddress),
                    voterHash
                }
            });
            // Emit update via Socket.io
            // Fetch updated counts
            const updatedPoll = await prisma.poll.findUnique({
                where: { id },
                include: { options: { include: { votes: true } } }
            });
            if (updatedPoll) {
                const payload = {
                    id: updatedPoll.id,
                    options: updatedPoll.options.map(opt => ({
                        id: opt.id,
                        text: opt.text,
                        votes: opt.votes.length
                    }))
                };
                io.to(id).emit('poll_update', payload);
            }
            res.json({ success: true, vote });
        }
        catch (e) {
            if (e.code === 'P2002') {
                res.status(403).json({ error: 'You have already voted in this poll' });
            }
            else {
                throw e;
            }
        }
    }
    catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: 'Failed to submit vote' });
    }
});
// Socket.io connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join_poll', (pollId) => {
        socket.join(pollId);
        console.log(`User ${socket.id} joined poll ${pollId}`);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
