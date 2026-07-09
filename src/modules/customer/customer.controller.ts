import { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { createCustomerSchema, updateCustomerSchema } from './customer.dto';
import { successResponse } from '../../common/response';

export const customerController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createCustomerSchema.parse(req.body);
      const customer = await customerService.create(parsed);
      res.status(201).json(successResponse(customer, 'Customer created'));
    } catch (err) {
      next(err);
    }
  },

  findMany: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, page, limit } = req.query;
      const result = await customerService.findMany({
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json(successResponse(result, 'Customers retrieved'));
    } catch (err) {
      next(err);
    }
  },

  findById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await customerService.findById(req.params.id);
      res.status(200).json(successResponse(customer, 'Customer retrieved'));
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateCustomerSchema.parse(req.body);
      const customer = await customerService.update(req.params.id, parsed);
      res.status(200).json(successResponse(customer, 'Customer updated'));
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await customerService.delete(req.params.id);
      res.status(200).json(successResponse({}, 'Customer deleted'));
    } catch (err) {
      next(err);
    }
  },
};
