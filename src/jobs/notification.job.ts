import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { notificationRepository } from '../modules/notification/notification.repository';

// Define job data payload
export interface NotificationJobData {
  userId: string;
  message: string;
  type?: string;
  conversationId?: string;
  messageId?: string;
}

const QUEUE_NAME = 'notification-queue';

// Initialize the queue
export const notificationQueue = new Queue<NotificationJobData>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true, // Automatically remove successfully completed jobs
  },
});

export function startNotificationWorker() {
  const notificationWorker = new Worker<NotificationJobData>(
    QUEUE_NAME,
    async (job: Job<NotificationJobData>) => {
      const { userId, message, type, conversationId, messageId } = job.data;
      
      // Process the job
      await notificationRepository.create(userId, message, type || 'SYSTEM', conversationId, messageId);
      
      return { success: true, userId };
    },
    {
      connection: redisConnection,
    }
  );

  // Worker Event Listeners for logging
  notificationWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job ${job.id} completed successfully! User notified: ${job.data.userId}`);
  });

  notificationWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} failed with error: ${err.message}`);
  });
  
  notificationWorker.on('error', (err) => {
    console.error(`[BullMQ] Worker encountered an error: ${err.message}`);
  });

  return notificationWorker;
}
