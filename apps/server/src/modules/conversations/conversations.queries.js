import { prisma } from '../../lib/prisma.js';

// Raw SQL for the two per-conversation aggregates Prisma can't express in one query.

const toMessage = (row) => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  body: row.body,
  clientMsgId: row.client_msg_id,
  createdAt: row.created_at,
});

/** @returns {Promise<Map<string, object>>} conversationId → latest message */
export const findLatestMessages = async (conversationIds) => {
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT ON (conversation_id) id, conversation_id, sender_id, body, client_msg_id, created_at
    FROM messages
    WHERE conversation_id = ANY(${conversationIds}::uuid[])
    ORDER BY conversation_id, created_at DESC, id DESC`;
  return new Map(rows.map((row) => [row.conversation_id, toMessage(row)]));
};

/** @returns {Promise<Map<string, number>>} conversationId → messages from others after the user's lastReadAt */
export const countUnreadMessages = async (userId, conversationIds) => {
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
};
