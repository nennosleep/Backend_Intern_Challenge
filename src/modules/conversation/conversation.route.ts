import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { conversationController } from './conversation.controller';

const router = Router();

// ── Conversation CRUD (any authenticated user) ────────────────────────────────
router.post('/conversations', authGuard as any, conversationController.create as any);
router.get('/conversations', authGuard as any, conversationController.findMany as any);
router.get('/conversations/:id', authGuard as any, conversationController.findById as any);
router.post('/conversations/:id/messages', authGuard as any, conversationController.sendMessage as any);
router.get('/conversations/:id/messages', authGuard as any, conversationController.getMessages as any);

// ── Assignment & Status (ADMIN or STAFF only) ─────────────────────────────────
router.post('/conversations/:id/assign', authGuard as any, roleGuard('ADMIN', 'STAFF') as any, conversationController.assign as any);
router.post('/conversations/:id/unassign', authGuard as any, roleGuard('ADMIN', 'STAFF') as any, conversationController.unassign as any);
router.post('/conversations/:id/close', authGuard as any, roleGuard('ADMIN', 'STAFF') as any, conversationController.close as any);
router.post('/conversations/:id/reopen', authGuard as any, roleGuard('ADMIN', 'STAFF') as any, conversationController.reopen as any);

export default router;

