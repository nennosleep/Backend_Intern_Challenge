import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { upload } from '../../config/multer';
import { attachmentController } from './attachment.controller';

const router = Router();

// Endpoint for standalone upload (Option B requires messageId in form-data)
router.post(
  '/attachments/upload',
  authGuard,
  roleGuard(['ADMIN', 'STAFF', 'CUSTOMER']),
  upload.single('file'), // 'file' is the field name for the uploaded file
  attachmentController.uploadFile,
);

// Endpoint to view/download file
router.get('/attachments/:id', authGuard, roleGuard(['ADMIN', 'STAFF', 'CUSTOMER']), attachmentController.downloadFile);

export default router;
