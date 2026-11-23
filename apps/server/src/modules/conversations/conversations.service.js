import { AppError } from '../../lib/AppError.js';
import { CONVERSATION_CREATED, domainEvents } from '../../lib/domainEvents.js';
import { presenceStore } from '../../lib/presenceStore.js';
import { isUniqueViolation, prisma } from '../../lib/prisma.js';
import { countUnreadMessages, findLatestMessages } from './conversations.queries.js';

const MIN_GROUP_OTHER_MEMBERS = 2;
const withMembers = { members: { include: { user: true } } };

export const buildDirectKey = (userIdA, userIdB) => [userIdA, userIdB].sort().join(':');

/** The permission rule for every conversation read and write. */
export const assertMember = async (conversationId, userId) => {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new AppError(403, 'NOT_A_MEMBER', 'You are not a member of this conversation');
};

const toConversationView = (conversation, { lastMessage = null, unreadCount = 0 } = {}) => ({
  id: conversation.id,
  type: conversation.type,
  name: conversation.name,
  createdAt: conversation.createdAt,
  lastMessageAt: conversation.lastMessageAt,
  lastMessage,
  unreadCount,
  members: conversation.members.map(({ role, user }) => ({ ...user, role, isOnline: presenceStore.isOnline(user.id) })),
});

/** Fixed number of queries however many conversations there are (no N+1). */
const toConversationViews = async (conversations, userId) => {
  const ids = conversations.map(({ id }) => id);
  const [latestMessages, unreadCounts] = await Promise.all([findLatestMessages(ids), countUnreadMessages(userId, ids)]);
  return conversations.map((conversation) =>
    toConversationView(conversation, {
      lastMessage: latestMessages.get(conversation.id) ?? null,
      unreadCount: unreadCounts.get(conversation.id) ?? 0,
    }),
  );
};

const announceCreated = (conversation) => {
  const view = toConversationView(conversation);
  domainEvents.emit(CONVERSATION_CREATED, view);
  return view;
};

const assertUsersExist = async (userIds) => {
  if ((await prisma.user.count({ where: { id: { in: userIds } } })) !== userIds.length) {
    throw new AppError(400, 'UNKNOWN_USERS', 'One or more users do not exist');
  }
};

const findDirect = (directKey) => prisma.conversation.findUnique({ where: { directKey }, include: withMembers });

export const listForUser = async (userId) => {
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: withMembers,
    orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  });
  return toConversationViews(conversations, userId);
};

export const listIdsForUser = async (userId) => {
  const memberships = await prisma.conversationMember.findMany({ where: { userId }, select: { conversationId: true } });
  return memberships.map(({ conversationId }) => conversationId);
};

export const findOrCreateDirect = async (currentUserId, otherUserId) => {
  if (otherUserId === currentUserId) {
    throw new AppError(400, 'INVALID_DIRECT_CHAT', 'You cannot start a direct chat with yourself');
  }
  await assertUsersExist([otherUserId]);

  const directKey = buildDirectKey(currentUserId, otherUserId);
  const existing = await findDirect(directKey);
  if (existing) return (await toConversationViews([existing], currentUserId))[0];

  try {
    const members = [currentUserId, otherUserId].map((userId) => ({ userId, role: 'member' }));
    return announceCreated(
      await prisma.conversation.create({
        data: { type: 'direct', directKey, createdById: currentUserId, members: { create: members } },
        include: withMembers,
      }),
    );
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // A concurrent request created the same direct chat first.
    return (await toConversationViews([await findDirect(directKey)], currentUserId))[0];
  }
};

export const createGroup = async (currentUserId, { name, memberIds }) => {
  const otherMemberIds = [...new Set(memberIds)].filter((id) => id !== currentUserId);
  if (otherMemberIds.length < MIN_GROUP_OTHER_MEMBERS) {
    throw new AppError(400, 'GROUP_TOO_SMALL', `A group needs at least ${MIN_GROUP_OTHER_MEMBERS} other members`);
  }
  await assertUsersExist(otherMemberIds);

  const members = [
    { userId: currentUserId, role: 'owner' },
    ...otherMemberIds.map((userId) => ({ userId, role: 'member' })),
  ];
  return announceCreated(
    await prisma.conversation.create({
      data: { type: 'group', name, createdById: currentUserId, members: { create: members } },
      include: withMembers,
    }),
  );
};

export const markRead = async (conversationId, userId) => {
  await assertMember(conversationId, userId);
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
};
