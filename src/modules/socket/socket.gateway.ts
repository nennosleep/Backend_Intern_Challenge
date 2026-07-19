import { Server, Socket } from 'socket.io';
import http from 'http';
import { socketAuthMiddleware } from './socket.middleware';
import { registerSocketHandlers } from './socket.handler';
import { createActivityLog } from '../../common/activityLog';

// Export io instance so other modules (e.g., Challenge 7 notifications) can emit events
export let io: Server;

/**
 * Initializes the Socket.IO server, attaches it to the HTTP server,
 * registers auth middleware, and sets up connection handling.
 */
export const initSocket = (httpServer: http.Server): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // In production, restrict to specific frontend domain
      methods: ['GET', 'POST'],
    },
  });

  // Register JWT authentication middleware for all connections
  io.use(socketAuthMiddleware);

  // Handle new client connections
  io.on('connection', async (socket: Socket) => {
    const { userId, email } = socket.data;

    console.log(`[Socket] Connected: userId=${userId}, socketId=${socket.id}`);

    // Log the connection event
    await createActivityLog({
      action: 'SOCKET_CONNECTED',
      userId,
      entityType: 'USER',
      entityId: userId,
      metadata: { socketId: socket.id, email },
    }).catch(() => {});

    // Register all event handlers for this socket
    registerSocketHandlers(io, socket);
  });

  console.log('[Socket] Socket.IO server initialized');
  return io;
};
