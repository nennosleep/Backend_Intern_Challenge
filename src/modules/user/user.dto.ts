import { z } from 'zod';

export const assignRoleSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']),
});

export type AssignRoleDto = z.infer<typeof assignRoleSchema>;
