import { AppError } from '../../lib/AppError.js';
import { isUniqueViolation, prisma } from '../../lib/prisma.js';
import { assertMember } from '../conversations/conversations.service.js';

const MAX_BODY_LENGTH = 4000;

const normalizeBody = (body) => {
  const text = body.trim();
  if (text.length === 0 || text.length > MAX_BODY_LENGTH) {
    throw new AppError(400, 'INVALID_MESSAGE_BODY', `Message must be between 1 and ${MAX_BODY_LENGTH} characters`);
  }
  return text;
};

const findByClientMsgId = (senderId, clientMsgId) =>
  prisma.message.findUnique({ where: { senderId_clientMsgId: { senderId, clientMsgId } } });

/**
 * Newest first, using Prisma's cursor pagination (the cursor is the id of the oldest message already loaded).
 * nextCursor is null once a page comes back short.
 */
export const listPage = async ({ conversationId, userId, cursor, limit }) => {
  await assertMember(conversationId, userId);

  const items = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  return { items, nextCursor: items.length === limit ? items.at(-1).id : null };
};

/**
 * Transport-agnostic send (REST, sockets, bots). Idempotent per (senderId, clientMsgId):
 * a retry returns the originally stored message instead of creating a duplicate.
 */
export const send = async ({ conversationId, senderId, body, clientMsgId }) => {
  await assertMember(conversationId, senderId);
  const text = normalizeBody(body);

  const existing = await findByClientMsgId(senderId, clientMsgId);
  if (existing) return existing;

  try {
    return await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({ data: { conversationId, senderId, body: text, clientMsgId } });
      await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: message.createdAt } });
      return message;
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // A concurrent retry with the same clientMsgId was stored first.
    return findByClientMsgId(senderId, clientMsgId);
  }
};
