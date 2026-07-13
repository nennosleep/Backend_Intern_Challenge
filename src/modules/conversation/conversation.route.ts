import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard';
import { conversationController } from './conversation.controller';

const router = Router();

router.post('/conversations', authGuard as any, conversationController.create as any);
router.get('/conversations', authGuard as any, conversationController.findMany as any);
router.get('/conversations/:id', authGuard as any, conversationController.findById as any);
router.post('/conversations/:id/messages', authGuard as any, conversationController.sendMessage as any);
router.get('/conversations/:id/messages', authGuard as any, conversationController.getMessages as any);

export default router;
