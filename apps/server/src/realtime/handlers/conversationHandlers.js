import { parseOrThrow } from '../../lib/validation.js';
import { conversationReadPayload } from '../../modules/conversations/conversations.schemas.js';
import { CLIENT_EVENTS } from '../events.js';
import { withAck } from './withAck.js';

export const registerConversationHandlers = (socket, { conversationsService }) => {
  const { userId } = socket.data;

  socket.on(
    CLIENT_EVENTS.CONVERSATION_READ,
    withAck(async (payload) => {
      const { conversationId } = parseOrThrow(conversationReadPayload, payload);
      await conversationsService.markRead(conversationId, userId);
      return {};
    }),
  );
};
