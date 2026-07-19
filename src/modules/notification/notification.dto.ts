import { z } from 'zod';

export const notificationQuerySchema = z.object({
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

export type NotificationQueryDto = z.infer<typeof notificationQuerySchema>;
