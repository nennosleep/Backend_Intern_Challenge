import 'dotenv/config';
import { startNotificationWorker } from './jobs/notification.job';
import { redisConnection } from './config/redis';

async function bootstrap() {
  console.log('Starting BullMQ background worker process...');
  
  try {
    // Check Redis connection
    await redisConnection.ping();
    console.log('Redis connection established for worker.');
    
    // Start workers
    startNotificationWorker();
    
    console.log('Notification worker started and waiting for jobs...');
  } catch (err: any) {
    console.error('Failed to start worker process:', err.message);
    process.exit(1);
  }

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('Gracefully shutting down worker process...');
    redisConnection.quit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
