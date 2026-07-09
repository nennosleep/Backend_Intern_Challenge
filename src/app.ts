import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import healthRoute from './modules/health/health.route';
import customerRoute from './modules/customer/customer.route';
import userRoute from './modules/user/user.route';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());
app.use(
  '/api-docs',
  swaggerUi.serve as any,
  swaggerUi.setup(swaggerSpec) as any,
);
app.use('/api', healthRoute);
app.use('/api', customerRoute);
app.use('/api', userRoute);

app.use(errorHandler);

export default app;
