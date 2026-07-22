import { Router } from 'express';
import { userController } from './user.controller';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';

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
router.get('/users', authGuard, roleGuard(['ADMIN']), userController.findMany);

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
router.get('/users/:id', authGuard, roleGuard(['ADMIN']), userController.findById);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   post:
 *     summary: Assign a role to a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, STAFF, CUSTOMER]
 *     responses:
 *       200:
 *         description: Role assigned successfully
 */
router.post('/users/:id/roles', authGuard, roleGuard(['ADMIN']), userController.assignRole);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   delete:
 *     summary: Remove a role from a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, STAFF, CUSTOMER]
 *     responses:
 *       200:
 *         description: Role removed successfully
 */
router.delete('/users/:id/roles', authGuard, roleGuard(['ADMIN']), userController.unassignRole);

export default router;
