import { prisma } from '../../config/prisma';

export const webhookRepository = {
  /**
   * Attempts to create a webhook event log.
   * Relies on the unique constraint of `eventId` to handle idempotency.
   * Throws an error (Prisma P2002) if the eventId already exists.
   */
  createEvent: async (eventId: string, payload: any) => {
    return prisma.webhookEvent.create({
      data: {
        eventId,
        payload,
        status: 'RECEIVED',
      },
    });
  },

  updateEventStatus: async (eventId: string, status: 'PROCESSED' | 'FAILED') => {
    return prisma.webhookEvent.update({
      where: { eventId },
      data: { status },
    });
  },

  findMany: async (page: number, limit: number) => {
    const events = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Mask sensitive payload
    return events.map(event => ({
      ...event,
      payload: { ...((event.payload as any) || {}), content: '***' },
    }));
  },

  count: async () => {
    return prisma.webhookEvent.count();
  },
};
