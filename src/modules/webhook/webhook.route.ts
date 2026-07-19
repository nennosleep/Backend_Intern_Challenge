import { Router } from 'express';
import { webhookGuard } from '../../middlewares/webhookGuard';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { webhookController } from './webhook.controller';

const router = Router();

// Public webhook receiver (protected by x-webhook-secret)
router.post('/webhooks/messages', webhookGuard, webhookController.receiveMessage);

// Admin log viewing
router.get('/webhooks/events', authGuard, roleGuard('ADMIN'), webhookController.getEvents);

export default router;
