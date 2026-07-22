import { z } from 'zod';
import { ConversationStatus } from '@prisma/client';

export const createConversationSchema = z.object({
  customerId: z.string().uuid('Invalid customerId format'),
});

export const createMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message content cannot exceed 2000 characters'),
});

export const conversationQuerySchema = z.object({
  status: z.nativeEnum(ConversationStatus).optional(),
  assignedTo: z.string().uuid('assignedTo must be a valid UUID').optional(),
  page: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z
      .number()
      .int('Page must be an integer')
      .positive('Page must be a positive integer')
      .optional()
      .default(1),
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z
      .number()
      .int('Limit must be an integer')
      .positive('Limit must be a positive integer')
      .max(100, 'Limit cannot exceed 100')
      .optional()
      .default(10),
  ),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export type CreateMessageDto = z.infer<typeof createMessageSchema>;
export type ConversationQueryDto = z.infer<typeof conversationQuerySchema>;

export const assignConversationSchema = z.object({
  staffUserId: z.string().uuid('staffUserId must be a valid UUID'),
});

export type AssignConversationDto = z.infer<typeof assignConversationSchema>;
