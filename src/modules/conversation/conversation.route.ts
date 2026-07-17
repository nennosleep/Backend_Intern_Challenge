import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard';
import { conversationController } from './conversation.controller';

const router = Router();

// ── Conversation CRUD (any authenticated user) ────────────────────────────────
router.post('/conversations', authGuard, conversationController.create);
router.get('/conversations', authGuard, conversationController.findMany);
router.get('/conversations/:id', authGuard, conversationController.findById);
router.post('/conversations/:id/messages', authGuard, conversationController.sendMessage);
router.get('/conversations/:id/messages', authGuard, conversationController.getMessages);

export default router;
