import { prisma } from '../../config/prisma';

export const userRepository = {
  findMany: () => {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  findById: (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  assignRole: async (userId: string, roleName: string) => {
    // Upsert role to ensure it exists
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    // Check if user already has this role
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });
  },
};
