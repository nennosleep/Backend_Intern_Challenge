import { webhookRepository } from './webhook.repository';
import { conversationRepository } from '../conversation/conversation.repository';
import { conversationService } from '../conversation/conversation.service';
import { WebhookMessageDto } from './webhook.dto';
import { SenderType } from '@prisma/client';
import { AppError } from '../../common/appError';

export const webhookService = {
  handleMessageWebhook: async (payload: WebhookMessageDto) => {
    try {
      // 1. Validate Idempotency: Attempt to save the webhook event.
      // If eventId already exists, Prisma will throw a unique constraint error (P2002).
      await webhookRepository.createEvent(payload.eventId, payload);
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Idempotency: Event already processed, return gracefully without error.
        console.log(`[Webhook] Duplicate eventId ignored: ${payload.eventId}`);
        return { status: 'ignored', message: 'Event already processed' };
      }
      throw error;
    }

    // 2. Verify conversation and membership
    const isMember = await conversationRepository.isMember(payload.conversationId, payload.customerId, 'CUSTOMER');
    if (!isMember) {
      await webhookRepository.updateEventStatus(payload.eventId, 'FAILED');
      throw new AppError('Customer is not a member of the conversation', 400);
    }

    // 3. Process the webhook: Save the incoming message
    // We simulate an incoming message from the customer via the webhook
    try {
      const message = await conversationService.sendMessage(
        payload.conversationId,
        payload.customerId,
        payload.content,
        SenderType.CUSTOMER
      );
      
      await webhookRepository.updateEventStatus(payload.eventId, 'PROCESSED');
      return { status: 'processed', messageId: message.id };
    } catch (err) {
      await webhookRepository.updateEventStatus(payload.eventId, 'FAILED');
      throw err;
    }
  },

  getEvents: async (query: { page?: number; limit?: number }) => {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [items, total] = await Promise.all([
      webhookRepository.findMany(page, limit),
      webhookRepository.count(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
