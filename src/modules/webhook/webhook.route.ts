import { Router } from 'express';
import { webhookGuard } from '../../middlewares/webhookGuard';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { webhookRateLimiter } from '../../middlewares/rateLimiter';
import { webhookController } from './webhook.controller';

const router = Router();

// Public webhook receiver (protected by x-webhook-secret and rate limit)
router.post('/webhooks/messages', webhookRateLimiter, webhookGuard, webhookController.receiveMessage);

// Admin log viewing
router.get('/webhooks/events', authGuard, roleGuard('ADMIN'), webhookController.getEvents);

export default router;
