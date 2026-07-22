import { prisma } from '../../config/prisma';

export const authRepository = {
  findbyEmail: (email: string) => {
    return prisma.user.findUnique({ 
      where: { email },
      include: { userRoles: { include: { role: true } } }
    });
  },

  findbyId: (id: string) => {
    return prisma.user.findUnique({ 
      where: { id },
      include: { userRoles: { include: { role: true } } }
    });
  },

  create: (data: { email: string; passwordHash: string; name: string }) => {
    return prisma.user.create({ data });
  },
};
