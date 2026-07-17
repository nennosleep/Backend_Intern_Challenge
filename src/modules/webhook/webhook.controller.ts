import { Request, Response, NextFunction } from 'express';
import { webhookService } from './webhook.service';
import { webhookMessageSchema, webhookQuerySchema } from './webhook.dto';
import { successResponse } from '../../common/response';

export const webhookController = {
  receiveMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = webhookMessageSchema.parse(req.body);
      const result = await webhookService.handleMessageWebhook(parsed);
      res.status(200).json(successResponse(result, 'Webhook processed'));
    } catch (error) {
      next(error);
    }
  },

  getEvents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = webhookQuerySchema.parse(req.query);
      const result = await webhookService.getEvents(parsed);
      res.status(200).json(successResponse(result, 'Webhook events retrieved'));
    } catch (error) {
      next(error);
    }
  },
};
