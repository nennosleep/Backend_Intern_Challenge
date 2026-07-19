import { prisma } from '../../config/prisma';

export const authRepository = {
  findbyEmail: (email: string) => {
    return prisma.user.findUnique({ where: { email } });
  },

  findbyId: (id: string) => {
    return prisma.user.findUnique({ where: { id } });
  },

  create: (data: { email: string; passwordHash: string; name: string }) => {
    return prisma.user.create({ data });
  },
};
