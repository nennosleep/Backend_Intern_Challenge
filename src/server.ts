import 'dotenv/config';
import http from 'http';
import app from './app';
import { initSocket } from './modules/socket/socket.gateway';
import './jobs/notification.job'; // Initialize BullMQ background workers

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Attach Socket.IO to the HTTP server
initSocket(httpServer);

// Start listening
httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
});
