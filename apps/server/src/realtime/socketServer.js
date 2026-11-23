import { Server } from 'socket.io';
import { env } from '../config/env.js';

export const createSocketServer = (httpServer) =>
  new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  });
