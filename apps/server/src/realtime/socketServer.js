import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { CONVERSATION_CREATED, domainEvents } from '../lib/domainEvents.js';
import { SERVER_EVENTS } from './events.js';
import { conversationRoom, userRoom } from './rooms.js';
import { socketAuth } from './socketAuth.js';
import { registerConnectionHandlers } from './handlers/connectionHandlers.js';
import { registerMessageHandlers } from './handlers/messageHandlers.js';

/** Members' live sockets join the new room, then each member receives conversation:new. */
const announceConversation = (io, conversation) => {
  const memberRooms = conversation.members.map(({ id }) => userRoom(id));
  io.in(memberRooms).socketsJoin(conversationRoom(conversation.id));
  io.to(memberRooms).emit(SERVER_EVENTS.CONVERSATION_NEW, conversation);
};

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, { cors: { origin: env.CLIENT_ORIGIN, credentials: true } });

  io.use(socketAuth);
  io.on('connection', (socket) => {
    registerMessageHandlers(io, socket);
    registerConnectionHandlers(io, socket);
  });
  domainEvents.on(CONVERSATION_CREATED, (conversation) => announceConversation(io, conversation));

  return io;
};
