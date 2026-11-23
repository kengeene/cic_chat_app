import { SERVER_EVENTS } from './events.js';
import { conversationRoom, userRoom } from './rooms.js';

/**
 * Builds the function services call after creating a conversation, so they never import Socket.IO.
 * Members' connected sockets join the new room, then each member receives conversation:new.
 */
export const createConversationNotifier = (io) => (conversation) => {
  const memberRooms = conversation.members.map(({ id }) => userRoom(id));
  io.in(memberRooms).socketsJoin(conversationRoom(conversation.id));
  io.to(memberRooms).emit(SERVER_EVENTS.CONVERSATION_NEW, conversation);
};
