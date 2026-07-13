import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { healthCheck } from './modules/health/health.controller';
import authRoute from './modules/auth/auth.route';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());
app.use(
  '/api-docs',
  swaggerUi.serve as any,
  swaggerUi.setup(swaggerSpec) as any,
);
app.use('/api', healthCheck);
app.use('/api', authRoute);
app.use(errorHandler);

export default app;
