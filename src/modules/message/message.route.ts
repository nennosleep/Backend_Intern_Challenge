import { Router } from 'express';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';
import { messageController } from './message.controller';

const router = Router();

router.get('/messages', authGuard, roleGuard(['ADMIN', 'STAFF', 'CUSTOMER']), messageController.findMany);

export default router;
