import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import pool from './db/index';

let io: Server;

// Simple rate guard: track join counts per socket
const JOIN_LIMIT = 50; // max rooms per socket connection
const socketJoinCounts = new Map<string, number>();

export function initializeSocket(httpServer: HTTPServer, corsOrigin: string): Server {
    io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        socketJoinCounts.set(socket.id, 0);

        socket.on('join_poll', async (pollId: string) => {
            // Validate pollId is a non-empty string
            if (!pollId || typeof pollId !== 'string') {
                socket.emit('error', { message: 'Invalid poll ID' });
                console.warn(`⚠️  Client ${socket.id} sent invalid pollId: ${pollId}`);
                return;
            }

            // Rate guard: prevent joining too many rooms
            const joinCount = socketJoinCounts.get(socket.id) || 0;
            if (joinCount >= JOIN_LIMIT) {
                socket.emit('error', { message: 'Too many poll joins' });
                console.warn(`⚠️  Client ${socket.id} exceeded join limit`);
                return;
            }

            // Validate poll exists in the database
            try {
                const result = await pool.query(
                    'SELECT id FROM polls WHERE id = $1',
                    [pollId]
                );

                if (result.rows.length === 0) {
                    socket.emit('error', { message: 'Poll not found' });
                    console.warn(`⚠️  Client ${socket.id} tried to join non-existent poll: ${pollId}`);
                    return;
                }

                // Only join if not already in the room
                if (socket.rooms.has(pollId)) {
                    console.log(`👁️  Client ${socket.id} already in poll: ${pollId}`);
                } else {
                    socket.join(pollId);
                    socketJoinCounts.set(socket.id, joinCount + 1);
                    console.log(`👁️  Client ${socket.id} joined poll: ${pollId}`);
                }
            } catch (err) {
                console.error(`❌ Error validating poll for socket ${socket.id}:`, err);
                socket.emit('error', { message: 'Failed to join poll' });
            }
        });

        socket.on('disconnect', () => {
            socketJoinCounts.delete(socket.id);
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

export function getIO(): Server {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}

export function broadcastPollUpdate(pollId: string, data: any): void {
    if (io) {
        io.to(pollId).emit('poll_update', data);
    }
}
