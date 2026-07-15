import { Socket } from 'socket.io';
import { verifyToken } from '../../common/jwt';

/**
 * Socket.IO middleware to authenticate clients using JWT.
 * Token is read from socket.handshake.auth.token or Authorization header.
 */
export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    // Support both: { auth: { token: "..." } } and { headers: { authorization: "Bearer ..." } }
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Unauthorized: No token provided'));
    }

    const payload = verifyToken(token);
    socket.data.userId = payload.userId;
    socket.data.email = payload.email;

    next();
  } catch (err) {
    next(new Error('Unauthorized: Invalid or expired token'));
  }
};
