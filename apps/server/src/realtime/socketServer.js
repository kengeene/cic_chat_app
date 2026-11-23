import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import { env } from '../config/env.js';
import { socketAuth } from './socketAuth.js';
import { createRateLimiter } from './rateLimiter.js';
import { registerConnectionHandlers } from './handlers/connectionHandlers.js';
import { registerMessageHandlers } from './handlers/messageHandlers.js';
import { registerConversationHandlers } from './handlers/conversationHandlers.js';

/** Created unattached so services can depend on it before the HTTP server exists; see server.js. */
export const createSocketServer = () => {
  const io = new Server({
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });
  io.use(socketAuth);
  return io;
};

/** Attaches to the HTTP server; cookies are parsed at the engine level so socketAuth can read the session. */
export const attachSocketServer = (io, httpServer) => {
  io.attach(httpServer);
  io.engine.use(cookieParser());
};

export const registerSocketHandlers = (io, { conversationsService, messagesService, usersService, presenceStore }) => {
  const messageRateLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 1000 });

  io.on('connection', (socket) => {
    registerMessageHandlers(io, socket, { messagesService, messageRateLimiter });
    registerConversationHandlers(socket, { conversationsService });
    registerConnectionHandlers(io, socket, { conversationsService, usersService, presenceStore });
  });
};
