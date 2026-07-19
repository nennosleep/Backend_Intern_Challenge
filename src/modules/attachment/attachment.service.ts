import { attachmentRepository } from './attachment.repository';
import { conversationRepository } from '../conversation/conversation.repository';
import { AppError } from '../../common/appError';
import { SenderType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const attachmentService = {
  uploadFile: async (
    messageId: string,
    file: Express.Multer.File,
    userId: string,
  ) => {
    // Note: The message must exist, and the user must be part of the conversation.
    // In Option B, we require messageId. The message should already belong to a conversation.
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    const isMember = await conversationRepository.isMember(message.conversationId, userId);
    if (!isMember) {
      throw new AppError('Access denied. Not a member of the conversation.', 403);
    }

    return attachmentRepository.create(
      messageId,
      file.originalname,
      file.mimetype,
      file.size,
      file.path,
    );
  },

  getFile: async (id: string, userId: string) => {
    const attachment = await attachmentRepository.findById(id);
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    // Verify conversation membership
    const conversationId = attachment.message.conversationId;
    const isMember = await conversationRepository.isMember(conversationId, userId);
    
    if (!isMember) {
      throw new AppError('Access denied to this attachment', 403);
    }

    const fullPath = path.resolve(attachment.filePath);
    if (!fs.existsSync(fullPath)) {
      throw new AppError('File physically missing on server', 404);
    }

    return {
      fullPath,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
    };
  },
};

// Assuming prisma is imported if we use it directly above, let's fix that.
import { prisma } from '../../config/prisma';
