import { prisma } from '../../config/prisma';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';

export const customerRepository = {
  create: (data: CreateCustomerDto) => {
    return prisma.customer.create({ data });
  },

  findMany: async (params: { search?: string; status?: string; page?: number; limit?: number }) => {
    const { search, status, page = 1, limit = 10 } = params;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
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
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
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
    return prisma.customer.delete({ where: { id } });
  },
};
