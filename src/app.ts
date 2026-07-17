import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import healthRouter from './modules/health/health.route';
import authRoute from './modules/auth/auth.route';
import customerRoute from './modules/customer/customer.route';
import userRoute from './modules/user/user.route';
import conversationRoute from './modules/conversation/conversation.route';
import notificationRoute from './modules/notification/notification.route';
import webhookRoute from './modules/webhook/webhook.route';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);
app.use('/api', healthRouter);
app.use('/api', authRoute);
app.use('/api', customerRoute);
app.use('/api', userRoute);
app.use('/api', conversationRoute);
app.use('/api', notificationRoute);
app.use('/api', webhookRoute);
app.use(errorHandler);

export default app;
