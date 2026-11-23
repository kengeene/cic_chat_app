import { RateLimiterMemory } from 'rate-limiter-flexible';
import { AppError } from '../../lib/AppError.js';
import { parseOrThrow } from '../../lib/validation.js';
import * as messagesService from '../../modules/messages/messages.service.js';
import { sendMessagePayload } from '../../modules/messages/messages.schemas.js';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../events.js';
import { conversationRoom } from '../rooms.js';
import { withAck } from './withAck.js';

// Swap for RateLimiterRedis when running more than one server.
const sendRateLimiter = new RateLimiterMemory({ points: 20, duration: 10 });

const consumeSendQuota = async (userId) => {
  try {
    await sendRateLimiter.consume(userId);
  } catch {
    throw new AppError(429, 'RATE_LIMITED', 'You are sending messages too quickly');
  }
};

export const registerMessageHandlers = (io, socket) => {
  const { userId } = socket.data;

  socket.on(
    CLIENT_EVENTS.MESSAGE_SEND,
    withAck(async (payload) => {
      const input = parseOrThrow(sendMessagePayload, payload);
      await consumeSendQuota(userId);

      const message = await messagesService.send({ ...input, senderId: userId });
      io.to(conversationRoom(message.conversationId)).emit(SERVER_EVENTS.MESSAGE_NEW, message);
      return { message };
    }),
  );
};
