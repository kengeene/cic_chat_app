import { createServer } from 'node:http';
import { createApp } from './app.js';
import { createServices } from './services.js';
import { attachSocketServer, createSocketServer, registerSocketHandlers } from './realtime/socketServer.js';
import { createPresenceStore } from './realtime/presenceStore.js';
import { createConversationNotifier } from './realtime/conversationNotifier.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

// Socket.IO is created first so services can be given a notifier bound to it,
// and attached last so it intercepts /socket.io/ before Express sees the request.
const io = createSocketServer();
const presenceStore = createPresenceStore();
const services = createServices({
  presence: presenceStore,
  notifyConversationCreated: createConversationNotifier(io),
});

const httpServer = createServer(createApp(services));
attachSocketServer(io, httpServer);
registerSocketHandlers(io, { ...services, presenceStore });

httpServer.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
});

/** Disconnects sockets, then closes the HTTP server it is attached to. */
const closeRealtimeAndHttp = () =>
  new Promise((resolve, reject) => io.close((error) => (error ? reject(error) : resolve())));

const forceExitAfterTimeout = () =>
  setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Shutting down');
  forceExitAfterTimeout();

  try {
    await closeRealtimeAndHttp();
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Shutdown failed');
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
