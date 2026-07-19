import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard';
import { notificationController } from './notification.controller';

const router = Router();

router.get('/notifications', authGuard, notificationController.findMany);
router.post('/notifications/:id/read', authGuard, notificationController.markAsRead);

export default router;
