import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { conversationRepository } from '../conversation/conversation.repository';
import { createActivityLog } from '../../common/activityLog';

// ── Validation Schemas ────────────────────────────────────────────────────────

const joinConversationSchema = z.object({
  conversationId: z.string().uuid('conversationId must be a valid UUID'),
});

const sendMessageSchema = z.object({
  conversationId: z.string().uuid('conversationId must be a valid UUID'),
  content: z
    .string()
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message content cannot exceed 2000 characters'),
});

// ── Handler Registration ──────────────────────────────────────────────────────

/**
 * Registers all Socket.IO event handlers for a connected socket.
 */
export const registerSocketHandlers = (io: Server, socket: Socket) => {
  const userId: string = socket.data.userId;

  // ── Event: join_conversation ──────────────────────────────────────────────
  socket.on('join_conversation', async (payload: unknown) => {
    try {
      const { conversationId } = joinConversationSchema.parse(payload);

      // Check the conversation exists
      const conversation = await conversationRepository.findById(conversationId);
      if (!conversation) {
        socket.emit('socket_error', { message: 'Conversation not found', code: 404 });
        return;
      }

      // Check the user is a member of this conversation
      const isMember = await conversationRepository.isMember(conversationId, userId);
      if (!isMember) {
        socket.emit('socket_error', {
          message: 'Access denied. You are not a member of this conversation.',
          code: 403,
        });
        return;
      }

      // Join the Socket.IO room for this conversation
      await socket.join(conversationId);

      socket.emit('joined_conversation', {
        conversationId,
        message: `Successfully joined conversation ${conversationId}`,
      });

      console.log(`[Socket] userId=${userId} joined room=${conversationId}`);

      // Log the join event
      await createActivityLog({
        action: 'SOCKET_JOIN_CONVERSATION',
        userId,
        entityType: 'CONVERSATION',
        entityId: conversationId,
        metadata: { socketId: socket.id },
      }).catch(() => {});
    } catch (err: unknown) {
      const error = err as { name?: string; errors?: unknown };
      if (error?.name === 'ZodError') {
        socket.emit('socket_error', { message: 'Invalid payload', details: error.errors });
      } else {
        socket.emit('socket_error', { message: 'Failed to join conversation' });
      }
    }
  });

  // ── Event: send_message ───────────────────────────────────────────────────
  socket.on('send_message', async (payload: unknown) => {
    try {
      const { conversationId, content } = sendMessageSchema.parse(payload);

      // Ensure the socket has already joined the room before sending
      if (!socket.rooms.has(conversationId)) {
        socket.emit('socket_error', {
          message:
            'You must join the conversation room before sending messages. Emit join_conversation first.',
          code: 403,
        });
        return;
      }

      // Double-check membership in DB (in case of stale socket state)
      const isMember = await conversationRepository.isMember(conversationId, userId);
      if (!isMember) {
        socket.emit('socket_error', {
          message: 'Access denied. You are not a member of this conversation.',
          code: 403,
        });
        return;
      }

      // Save message to the database
      const message = await conversationRepository.createMessage(conversationId, userId, content);

      // Broadcast the new message to ALL members in the room (including sender)
      io.to(conversationId).emit('new_message', {
        id: message.id,
        conversationId,
        senderId: userId,
        content: message.content,
        sentAt: message.sentAt,
      });

      console.log(`[Socket] userId=${userId} sent message to room=${conversationId}`);

      // Log the message sent event
      await createActivityLog({
        action: 'SOCKET_MESSAGE_SENT',
        userId,
        entityType: 'CONVERSATION',
        entityId: conversationId,
        metadata: { messageId: message.id },
      }).catch(() => {});
    } catch (err: unknown) {
      const error = err as { name?: string; errors?: unknown; message?: string };
      if (error?.name === 'ZodError') {
        socket.emit('socket_error', { message: 'Invalid payload', details: error.errors });
      } else {
        socket.emit('socket_error', { message: 'Failed to send message' });

        // Log the error event
        await createActivityLog({
          action: 'SOCKET_ERROR',
          userId,
          entityType: 'USER',
          entityId: userId,
          metadata: { event: 'send_message', error: error?.message },
        }).catch(() => {});
      }
    }
  });

  // ── Event: disconnect ─────────────────────────────────────────────────────
  socket.on('disconnect', async (reason: string) => {
    console.log(
      `[Socket] Disconnected: userId=${userId}, socketId=${socket.id}, reason=${reason}`,
    );

    // Log the disconnect event
    await createActivityLog({
      action: 'SOCKET_DISCONNECTED',
      userId,
      entityType: 'USER',
      entityId: userId,
      metadata: { socketId: socket.id, reason },
    }).catch(() => {});
  });
};
