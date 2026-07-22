import { z } from 'zod';

export const webhookMessageSchema = z.object({
  eventId: z.string().uuid('eventId must be a valid UUID'),
  conversationId: z.string().uuid('conversationId must be a valid UUID'),
  customerId: z.string().uuid('customerId must be a valid UUID'),
  content: z
    .string()
    .trim()
    .min(1, 'Content cannot be empty')
    .max(2000, 'Content cannot exceed 2000 characters'),
});

export const webhookQuerySchema = z.object({
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

export type WebhookMessageDto = z.infer<typeof webhookMessageSchema>;
export type WebhookQueryDto = z.infer<typeof webhookQuerySchema>;
