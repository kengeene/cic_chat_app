import { prisma } from '../../lib/prisma.js';
import { isUniqueViolation } from '../../lib/prismaErrors.js';

const withMembers = { members: { include: { user: true } } };

const asMembers = (userIds, role) => userIds.map((userId) => ({ userId, role }));

export const conversationsRepository = {
  findAllForUser: (userId) =>
    prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: withMembers,
      orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    }),

  findIdsForUser: async (userId) => {
    const memberships = await prisma.conversationMember.findMany({ where: { userId }, select: { conversationId: true } });
    return memberships.map(({ conversationId }) => conversationId);
  },

  findByDirectKey: (directKey) => prisma.conversation.findUnique({ where: { directKey }, include: withMembers }),

  /** @returns the new conversation, or null if a concurrent request created the same direct chat first */
  createDirect: async ({ directKey, createdById, memberIds }) => {
    try {
      return await prisma.conversation.create({
        data: { type: 'direct', directKey, createdById, members: { create: asMembers(memberIds, 'member') } },
        include: withMembers,
      });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  },

  createGroup: ({ name, createdById, memberIds }) =>
    prisma.conversation.create({
      data: {
        type: 'group',
        name,
        createdById,
        members: { create: [...asMembers([createdById], 'owner'), ...asMembers(memberIds, 'member')] },
      },
      include: withMembers,
    }),

  findMembership: (conversationId, userId) =>
    prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } }),

  updateLastReadAt: (conversationId, userId, lastReadAt) =>
    prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt },
    }),
};
