import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { healthCheck } from './modules/health.controller';

const app = express();

app.use(express.json());
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);
app.use('/api', healthCheck);

export default app;
