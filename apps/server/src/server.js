import { createServer } from 'node:http';
import { createApp } from './app.js';
import { createSocketServer } from './realtime/socketServer.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const httpServer = createServer(createApp());
const io = createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down`);
  io.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
