import { prisma } from '../config/prisma';

export const createActivityLog = (params: {
  action: string;
  description?: string;
  userId?: string;
  conversationId?: string;
}) => {
  return prisma.activityLog.create({
    data: {
      action: params.action,
      description: params.description,
      userId: params.userId,
      conversationId: params.conversationId,
    },
  });
};
