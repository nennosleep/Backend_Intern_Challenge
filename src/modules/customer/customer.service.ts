import { customerRepository } from './customer.repository';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';
import { createActivityLog } from '../../common/activityLog';
import { Prisma } from '@prisma/client';

export const customerService = {
  create: async (data: CreateCustomerDto, userId?: string) => {
    if (data.email || data.phone) {
      const existing = await customerRepository.findByEmailOrPhone(
        data.email,
        data.phone,
      );
      if (existing) {
        const error: any = new Error('Email or phone already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    try {
      const customer = await customerRepository.create(data);

      await createActivityLog({
        action: 'CREATE_CUSTOMER',
        userId,
        entityType: 'CUSTOMER',
        entityId: customer.id,
        metadata: { message: `Customer "${customer.name}" was created` },
      });

      return customer;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const error: any = new Error('Email or phone already exists');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  },

  findMany: async (query: {
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const page = query.page || 1;
    const limit = query.limit || 10;

    const [items, total] = await Promise.all([
      customerRepository.findMany({ search: query.search, page, limit }),
      customerRepository.count(query.search),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  findById: async (id: string) => {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      const error: any = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }
    return customer;
  },

  update: async (id: string, data: UpdateCustomerDto, userId?: string) => {
    await customerService.findById(id); // đảm bảo tồn tại

    if (data.email || data.phone) {
      const existing = await customerRepository.findByEmailOrPhone(
        data.email,
        data.phone,
      );
      if (existing && existing.id !== id) {
        const error: any = new Error('Email or phone already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    try {
      const customer = await customerRepository.update(id, data);

      await createActivityLog({
        action: 'UPDATE_CUSTOMER',
        userId,
        entityType: 'CUSTOMER',
        entityId: customer.id,
        metadata: { message: `Customer "${customer.name}" was updated` },
      });

      return customer;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const error: any = new Error('Email or phone already exists');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  },

  delete: async (id: string) => {
    await customerService.findById(id);
    return customerRepository.delete(id);
  },
};
