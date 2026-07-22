import { conversationService } from './conversation.service';
import { attachmentService } from '../attachment/attachment.service';
import {
  createConversationSchema,
  createMessageSchema,
  conversationQuerySchema,
  assignConversationSchema,
} from './conversation.dto';
import { successResponse, paginationResponse } from '../../common/response';
import { AppError } from '../../common/appError';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export const conversationController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createConversationSchema.parse(req.body);
      const conversation = await conversationService.create(
        parsed.customerId,
        req.user!.userId,
      );
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
      res.status(200).json(paginationResponse(result.items, result.pagination, 'Conversations retrieved'));
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

  sendMessageWithAttachment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }
      
      const parsed = createMessageSchema.parse(req.body);
      const userId = req.user!.userId;
      
      let message;
      try {
        // 1. Check if user is member (done inside sendMessage)
        message = await conversationService.sendMessage(req.params.id, userId, parsed.content);
        
        // 2. Attach the file
        const attachment = await attachmentService.uploadFile(message.id, req.file, userId);
        
        res.status(201).json(successResponse({ message, attachment }, 'Message sent with attachment'));
      } catch (err) {
        // If anything fails after file upload, clean up the file
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw err;
      }
    } catch (error) {
      // Also clean up file if parsing body fails or no file uploaded
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  },

  getMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = conversationQuerySchema.parse(req.query);
      const userId = req.user!.userId;
      const result = await conversationService.getMessages(req.params.id, userId, parsed);
      res.status(200).json(paginationResponse(result.items, result.pagination, 'Messages retrieved'));
    } catch (error) {
      next(error);
    }
  },

  // ── Assignment & Status ──────────────────────────────────────────────────

  assign: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { staffUserId } = assignConversationSchema.parse(req.body);
      const actorUserId = req.user!.userId;
      const result = await conversationService.assign(req.params.id, staffUserId, actorUserId);
      res.status(200).json(successResponse(result, 'Conversation assigned successfully'));
    } catch (error) {
      next(error);
    }
  },

  unassign: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorUserId = req.user!.userId;
      const result = await conversationService.unassign(req.params.id, actorUserId);
      res.status(200).json(successResponse(result, 'Conversation unassigned successfully'));
    } catch (error) {
      next(error);
    }
  },

  close: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorUserId = req.user!.userId;
      const result = await conversationService.close(req.params.id, actorUserId);
      res.status(200).json(successResponse(result, 'Conversation closed successfully'));
    } catch (error) {
      next(error);
    }
  },

  reopen: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorUserId = req.user!.userId;
      const result = await conversationService.reopen(req.params.id, actorUserId);
      res.status(200).json(successResponse(result, 'Conversation reopened successfully'));
    } catch (error) {
      next(error);
    }
  },
};
