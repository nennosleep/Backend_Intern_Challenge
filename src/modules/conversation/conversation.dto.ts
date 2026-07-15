import { z } from 'zod';

export const createConversationSchema = z.object({
  customerId: z.string().uuid('Invalid customerId format'),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
});

export const conversationQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().int().positive('Page must be a positive integer').optional()
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().int().positive('Limit must be a positive integer').optional()
  ),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export type CreateMessageDto = z.infer<typeof createMessageSchema>;
export type ConversationQueryDto = z.infer<typeof conversationQuerySchema>;

export const assignConversationSchema = z.object({
  staffUserId: z.string().uuid('staffUserId must be a valid UUID'),
});

export type AssignConversationDto = z.infer<typeof assignConversationSchema>;

