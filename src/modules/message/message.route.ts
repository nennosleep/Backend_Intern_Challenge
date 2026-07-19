import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard';
import { messageController } from './message.controller';

const router = Router();

router.get('/messages', authGuard, messageController.findMany);

export default router;
