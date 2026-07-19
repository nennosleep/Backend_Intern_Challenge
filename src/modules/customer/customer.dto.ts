import { z } from 'zod';
import { CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  page: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().int().positive('Page must be a positive integer').optional()
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().int().positive('Limit must be a positive integer').optional()
  ),
});

export type CustomerQueryDto = z.infer<typeof customerQuerySchema>;
