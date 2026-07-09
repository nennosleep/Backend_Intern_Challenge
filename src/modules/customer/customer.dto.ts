import { z } from 'zod';

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
