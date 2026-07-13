import { prisma } from '../../config/prisma';
import { ConversationStatus, ParticipantType, SenderType } from '@prisma/client';

export const conversationRepository = {
  create: async (customerId: string, userId: string) => {
    return prisma.$transaction(async (tx) => {
      // 1. Tạo cuộc hội thoại mới
      const conversation = await tx.conversation.create({
        data: {
          customerId,
          status: ConversationStatus.ASSIGNED,
        },
      });

      // 2. Thêm các thành viên vào cuộc hội thoại (Khách hàng & Nhân viên hỗ trợ tạo)
      await tx.conversationMember.createMany({
        data: [
          {
            conversationId: conversation.id,
            participantType: ParticipantType.CUSTOMER,
            customerId: customerId,
          },
          {
            conversationId: conversation.id,
            participantType: ParticipantType.USER,
            userId: userId,
          },
        ],
      });

      // 3. Phân công cuộc hội thoại này cho Nhân viên hỗ trợ tạo
      await tx.assignment.create({
        data: {
          conversationId: conversation.id,
          userId: userId,
          isActive: true,
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
      // 1. Tạo Message
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          senderType: SenderType.USER,
          content,
        },
      });

      // 2. Cập nhật thời gian updatedAt của Conversation
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
      orderBy: { sentAt: 'asc' }, // Sắp xếp tin nhắn cũ trước mới sau
    });
  },

  countMessages: async (conversationId: string) => {
    return prisma.message.count({
      where: { conversationId },
    });
  },
};
