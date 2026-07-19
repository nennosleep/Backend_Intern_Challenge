import { prisma } from '../../config/prisma';

export const attachmentRepository = {
  create: async (
    messageId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    filePath: string,
  ) => {
    return prisma.attachment.create({
      data: {
        messageId,
        fileName,
        fileType,
        fileSize,
        filePath,
      },
    });
  },

  findById: async (id: string) => {
    return prisma.attachment.findUnique({
      where: { id },
      include: {
        message: {
          include: {
            conversation: true,
          },
        },
      },
    });
  },
};
