import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '../common/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json(errorResponse('Validation failed', err.issues));
  }

  const status = err.statusCode || 500;
  res
    .status(status)
    .json(errorResponse(err.message || 'Internal Server Error'));
};
