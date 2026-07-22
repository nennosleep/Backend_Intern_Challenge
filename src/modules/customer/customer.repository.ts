import { prisma } from '../../config/prisma';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';

import { Prisma } from '@prisma/client';

export const customerRepository = {
  create: (data: CreateCustomerDto) => {
    return prisma.customer.create({ data });
  },

  findMany: async (params: { search?: string; status?: string; page?: number; limit?: number }) => {
    const { search, status, page = 1, limit = 10 } = params;
    
    const where: Prisma.CustomerWhereInput = {
      status: { not: 'DELETED' }, // By default, ignore DELETED
    };
    
    if (search) {
      const keyword = search.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status as any;
    }

    const [data, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  count: (search?: string, status?: string) => {
    const where: Prisma.CustomerWhereInput = {
      status: { not: 'DELETED' },
    };
    if (search) {
      const keyword = search.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status as any;
    }
    return prisma.customer.count({ where });
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
    return prisma.customer.update({ where: { id }, data: { status: 'DELETED' } });
  },
};
