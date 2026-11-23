import { logger } from '../../lib/logger.js';
import { SERVER_EVENTS } from '../events.js';
import { conversationRoom, userRoom } from '../rooms.js';

const joinRooms = async (socket, userId, conversationsService) => {
  const conversationIds = await conversationsService.listIdsForUser(userId);
  socket.join([userRoom(userId), ...conversationIds.map(conversationRoom)]);
};

const goOffline = async (io, userId, usersService) => {
  const lastSeenAt = new Date();
  try {
    await usersService.markLastSeen(userId, lastSeenAt);
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to save lastSeenAt');
  }
  io.emit(SERVER_EVENTS.PRESENCE_UPDATE, { userId, isOnline: false, lastSeenAt });
};

export const registerConnectionHandlers = async (io, socket, { conversationsService, usersService, presenceStore }) => {
  const { userId } = socket.data;

  // Registered first so presence stays balanced even if joining rooms fails.
  socket.on('disconnect', () => {
    if (presenceStore.disconnect(userId)) goOffline(io, userId, usersService);
  });
  if (presenceStore.connect(userId)) {
    socket.broadcast.emit(SERVER_EVENTS.PRESENCE_UPDATE, { userId, isOnline: true, lastSeenAt: null });
  }

  try {
    await joinRooms(socket, userId, conversationsService);
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to join conversation rooms');
    socket.disconnect(true);
  }
};
