import { Request, Response, NextFunction } from 'express';
import { conversationService } from './conversation.service';
import {
  createConversationSchema,
  createMessageSchema,
  conversationQuerySchema,
} from './conversation.dto';
import { successResponse } from '../../common/response';

export const conversationController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createConversationSchema.parse(req.body);
      const conversation = await conversationService.create(parsed.customerId);
      res.status(201).json(successResponse(conversation, 'Conversation created'));
    } catch (error) {
      next(error);
    }
  },

  findMany: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = conversationQuerySchema.parse(req.query);
      const userId = req.user!.userId;
      const result = await conversationService.findMany(userId, parsed);
      res.status(200).json(successResponse(result, 'Conversations retrieved'));
    } catch (error) {
      next(error);
    }
  },

  findById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const conversation = await conversationService.findById(req.params.id, userId);
      res.status(200).json(successResponse(conversation, 'Conversation retrieved'));
    } catch (error) {
      next(error);
    }
  },

  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createMessageSchema.parse(req.body);
      const userId = req.user!.userId;
      const message = await conversationService.sendMessage(req.params.id, userId, parsed.content);
      res.status(201).json(successResponse(message, 'Message sent'));
    } catch (error) {
      next(error);
    }
  },

  getMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = conversationQuerySchema.parse(req.query);
      const userId = req.user!.userId;
      const result = await conversationService.getMessages(req.params.id, userId, parsed);
      res.status(200).json(successResponse(result, 'Messages retrieved'));
    } catch (error) {
      next(error);
    }
  },
};
