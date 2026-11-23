import { AppError } from '../../lib/AppError.js';
import { assertConversationMember } from '../conversations/conversationMembership.js';
import { decodeCursor, encodeCursor } from './messageCursor.js';

export const MAX_BODY_LENGTH = 4000;

const normalizeBody = (body) => {
  const text = body.trim();
  if (text.length === 0 || text.length > MAX_BODY_LENGTH) {
    throw new AppError(400, 'INVALID_MESSAGE_BODY', `Message must be between 1 and ${MAX_BODY_LENGTH} characters`);
  }
  return text;
};

export const createMessagesService = ({ messagesRepository, conversationsRepository }) => ({
  /** Newest first. nextCursor points at the oldest returned message, or null when there is no older page. */
  async listPage({ conversationId, userId, cursor, limit }) {
    await assertConversationMember(conversationsRepository, conversationId, userId);

    const rows = await messagesRepository.findPage({
      conversationId,
      before: cursor ? decodeCursor(cursor) : null,
      limit: limit + 1,
    });
    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? encodeCursor(items.at(-1)) : null };
  },

  /**
   * Transport-agnostic send (REST, sockets, bots). Idempotent per (senderId, clientMsgId):
   * a retry returns the originally stored message instead of creating a duplicate.
   */
  async send({ conversationId, senderId, body, clientMsgId }) {
    await assertConversationMember(conversationsRepository, conversationId, senderId);
    const text = normalizeBody(body);

    const existing = await messagesRepository.findBySenderAndClientMsgId(senderId, clientMsgId);
    if (existing) return existing;

    const created = await messagesRepository.create({ conversationId, senderId, body: text, clientMsgId });
    return created ?? messagesRepository.findBySenderAndClientMsgId(senderId, clientMsgId);
  },
});
