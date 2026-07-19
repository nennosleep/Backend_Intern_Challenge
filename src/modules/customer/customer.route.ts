import { Router } from 'express';
import { customerController } from './customer.controller';
import { authGuard } from '../../middlewares/authGuard';
import { roleGuard } from '../../middlewares/roleGuard';

const router = Router();

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     responses:
 *       201:
 *         description: Customer created
 *   get:
 *     summary: Get list of customers
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of customers
 */
router.post('/customers', authGuard, roleGuard('ADMIN', 'STAFF'), customerController.create);
router.get('/customers', authGuard, roleGuard('ADMIN', 'STAFF'), customerController.findMany);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer detail
 *   put:
 *     summary: Update customer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer updated
 *   delete:
 *     summary: Delete customer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer deleted
 */
router.get('/customers/:id', authGuard, roleGuard('ADMIN', 'STAFF'), customerController.findById);
router.put('/customers/:id', authGuard, roleGuard('ADMIN', 'STAFF'), customerController.update);
router.delete('/customers/:id', authGuard, roleGuard('ADMIN', 'STAFF'), customerController.delete);

export default router;
