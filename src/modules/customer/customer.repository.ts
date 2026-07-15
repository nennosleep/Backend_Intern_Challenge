import { prisma } from '../../config/prisma';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';

export const customerRepository = {
  create: (data: CreateCustomerDto) => {
    return prisma.customer.create({ data });
  },

  findMany: (params: { search?: string; page: number; limit: number }) => {
    const { search, page, limit } = params;
    return prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  },

  count: (search?: string) => {
    return prisma.customer.count({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    });
  },

  findById: (id: string) => {
    return prisma.customer.findUnique({ where: { id } });
  },

  findByEmailOrPhone: (email?: string, phone?: string) => {
    const conditions = [];

    if (email) {
      conditions.push({ email });
    }
    if (phone) {
      conditions.push({ phone });
    }

    return prisma.customer.findFirst({
      where: { OR: conditions },
    });
  },

  update: (id: string, data: UpdateCustomerDto) => {
    return prisma.customer.update({ where: { id }, data });
  },

  delete: (id: string) => {
    return prisma.customer.delete({ where: { id } });
  },
};
