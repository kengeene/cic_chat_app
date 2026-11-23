import { AppError } from '../../lib/AppError.js';
import { parseOrThrow } from '../../lib/validation.js';
import { sendMessagePayload } from '../../modules/messages/messages.schemas.js';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../events.js';
import { conversationRoom } from '../rooms.js';
import { withAck } from './withAck.js';

export const registerMessageHandlers = (io, socket, { messagesService, messageRateLimiter }) => {
  const { userId } = socket.data;

  socket.on(
    CLIENT_EVENTS.MESSAGE_SEND,
    withAck(async (payload) => {
      const input = parseOrThrow(sendMessagePayload, payload);
      if (!messageRateLimiter.tryConsume(userId)) {
        throw new AppError(429, 'RATE_LIMITED', 'You are sending messages too quickly');
      }

      const message = await messagesService.send({ ...input, senderId: userId });
      io.to(conversationRoom(message.conversationId)).emit(SERVER_EVENTS.MESSAGE_NEW, message);
      return { message };
    }),
  );
};
