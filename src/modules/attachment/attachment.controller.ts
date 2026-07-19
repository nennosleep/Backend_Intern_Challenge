import { Request, Response, NextFunction } from 'express';
import { attachmentService } from './attachment.service';
import { successResponse } from '../../common/response';
import { AppError } from '../../common/appError';

export const attachmentController = {
  uploadFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const messageId = req.body.messageId;
      if (!messageId) {
        throw new AppError('messageId is required', 400);
      }

      const userId = req.user!.userId;
      const result = await attachmentService.uploadFile(messageId, req.file, userId);
      
      res.status(201).json(successResponse(result, 'File uploaded successfully'));
    } catch (error) {
      next(error);
    }
  },

  downloadFile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const userId = req.user!.userId;

      const fileData = await attachmentService.getFile(id, userId);
      
      // Serve the file directly
      res.download(fileData.fullPath, fileData.fileName, (err) => {
        if (err) {
          next(new AppError('Error downloading file', 500));
        }
      });
    } catch (error) {
      next(error);
    }
  },
};
