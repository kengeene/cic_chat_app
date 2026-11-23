import { prisma } from '../../lib/prisma.js';
import { isUniqueViolation } from '../../lib/prismaErrors.js';

const olderThan = ({ createdAt, id }) => ({
  OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
});

const fromRow = (row) => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  body: row.body,
  clientMsgId: row.client_msg_id,
  createdAt: row.created_at,
});

export const messagesRepository = {
  /** Newest first, strictly older than `before` when given. */
  findPage: ({ conversationId, before, limit }) =>
    prisma.message.findMany({
      where: { conversationId, ...(before && olderThan(before)) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    }),

  findBySenderAndClientMsgId: (senderId, clientMsgId) =>
    prisma.message.findUnique({ where: { senderId_clientMsgId: { senderId, clientMsgId } } }),

  /** Saves the message and bumps conversation.lastMessageAt atomically. Returns null on a duplicate clientMsgId. */
  create: async ({ conversationId, senderId, body, clientMsgId }) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({ data: { conversationId, senderId, body, clientMsgId } });
        await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: message.createdAt } });
        return message;
      });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  },

  /** @returns {Promise<Map<string, object>>} conversationId → latest message (one query, uses the (conversation_id, created_at) index) */
  findLatestPerConversation: async (conversationIds) => {
    const rows = await prisma.$queryRaw`
      SELECT DISTINCT ON (conversation_id) id, conversation_id, sender_id, body, client_msg_id, created_at
      FROM messages
      WHERE conversation_id = ANY(${conversationIds}::uuid[])
      ORDER BY conversation_id, created_at DESC, id DESC`;
    return new Map(rows.map((row) => [row.conversation_id, fromRow(row)]));
  },

  /** @returns {Promise<Map<string, number>>} conversationId → messages from others after the user's lastReadAt */
  countUnreadPerConversation: async (userId, conversationIds) => {
    const rows = await prisma.$queryRaw`
      SELECT m.conversation_id, COUNT(*)::int AS unread_count
      FROM messages m
      JOIN conversation_members cm
        ON cm.conversation_id = m.conversation_id AND cm.user_id = ${userId}::uuid
      WHERE m.conversation_id = ANY(${conversationIds}::uuid[])
        AND m.sender_id <> ${userId}::uuid
        AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
      GROUP BY m.conversation_id`;
    return new Map(rows.map((row) => [row.conversation_id, row.unread_count]));
  },
};
