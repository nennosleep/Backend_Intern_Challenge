import { prisma } from '../../config/prisma';
import { ConversationStatus, ParticipantType, SenderType } from '@prisma/client';

export const conversationRepository = {
  /**
   * Creates a new OPEN conversation and adds only the customer as a member.
   * Staff assignment must be done explicitly via the assign API (Challenge 6).
   */
  create: async (customerId: string) => {
    return prisma.$transaction(async (tx) => {
      // 1. Create new conversation with OPEN status (no auto-assign)
      const conversation = await tx.conversation.create({
        data: {
          customerId,
          status: ConversationStatus.OPEN,
        },
      });

      // 2. Add the customer as a member of the conversation
      await tx.conversationMember.create({
        data: {
          conversationId: conversation.id,
          participantType: ParticipantType.CUSTOMER,
          customerId: customerId,
        },
      });

      return conversation;
    });
  },

  findManyByUserId: async (userId: string, page: number, limit: number) => {
    return prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  },

  countByUserId: async (userId: string) => {
    return prisma.conversation.count({
      where: {
        members: {
          some: { userId },
        },
      },
    });
  },

  findById: async (id: string) => {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        members: true,
      },
    });
  },

  isMember: async (conversationId: string, userId: string) => {
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId },
    });
    return !!member;
  },

  createMessage: async (conversationId: string, senderId: string, content: string) => {
    return prisma.$transaction(async (tx) => {
      // 1. Create the message
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          senderType: SenderType.USER,
          content,
        },
      });

      // 2. Update the conversation's updatedAt timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  },

  findMessages: async (conversationId: string, page: number, limit: number) => {
    return prisma.message.findMany({
      where: { conversationId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { sentAt: 'asc' },
    });
  },

  countMessages: async (conversationId: string) => {
    return prisma.message.count({
      where: { conversationId },
    });
  },
};
