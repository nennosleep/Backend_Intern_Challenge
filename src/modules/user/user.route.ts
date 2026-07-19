import { Router } from 'express';
import { userController } from './user.controller';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get list of users
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', userController.findMany);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User detail
 */
router.get('/users/:id', userController.findById);

export default router;
