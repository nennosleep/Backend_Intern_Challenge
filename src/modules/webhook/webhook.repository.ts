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
      },
    });
  },

  findMany: async (page: number, limit: number) => {
    return prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  count: async () => {
    return prisma.webhookEvent.count();
  },
};
