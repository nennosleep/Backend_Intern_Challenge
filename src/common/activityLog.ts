import { prisma } from '../config/prisma';

export const createActivityLog = (params: {
  action: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}) => {
  return prisma.activityLog.create({
    data: {
      action: params.action,
      userId: params.userId,
      entityType: params.entityType || 'SYSTEM',
      entityId: params.entityId,
      metadata: params.metadata || {},
    },
  });
};
