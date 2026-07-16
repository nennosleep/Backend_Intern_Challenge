import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { conversationController } from './conversation.controller';

const router = Router();

// ── Conversation CRUD (any authenticated user) ────────────────────────────────
router.post('/conversations', authGuard, conversationController.create);
router.get('/conversations', authGuard, conversationController.findMany);
router.get('/conversations/:id', authGuard, conversationController.findById);
router.post('/conversations/:id/messages', authGuard, conversationController.sendMessage);
router.get('/conversations/:id/messages', authGuard, conversationController.getMessages);

// ── Assignment & Status (ADMIN or STAFF only) ─────────────────────────────────
router.post(
  '/conversations/:id/assign',
  authGuard,
  roleGuard('ADMIN', 'STAFF'),
  conversationController.assign,
);
router.post(
  '/conversations/:id/unassign',
  authGuard,
  roleGuard('ADMIN', 'STAFF'),
  conversationController.unassign,
);
router.post(
  '/conversations/:id/close',
  authGuard,
  roleGuard('ADMIN', 'STAFF'),
  conversationController.close,
);
router.post(
  '/conversations/:id/reopen',
  authGuard,
  roleGuard('ADMIN', 'STAFF'),
  conversationController.reopen,
);

export default router;
