import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export function initializeSocket(httpServer: HTTPServer, corsOrigin: string): Server {
    io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        socket.on('join_poll', (pollId: string) => {
            socket.join(pollId);
            console.log(`👁️  Client ${socket.id} joined poll: ${pollId}`);
        });

        socket.on('disconnect', () => {
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
