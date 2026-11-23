import { AppError } from '../../lib/AppError.js';
import { toPublicUser } from '../users/users.mapper.js';
import { assertConversationMember } from './conversationMembership.js';

const MIN_GROUP_OTHER_MEMBERS = 2;

export const buildDirectKey = (userIdA, userIdB) => [userIdA, userIdB].sort().join(':');

/**
 * @param {object} deps
 * @param {(conversation: object) => void} deps.notifyConversationCreated realtime hook (rooms + conversation:new)
 * @param {{ isOnline(userId: string): boolean }} deps.presence
 */
export const createConversationsService = ({
  conversationsRepository,
  messagesRepository,
  usersRepository,
  presence,
  notifyConversationCreated,
}) => {
  const toConversationView = (conversation, { lastMessage = null, unreadCount = 0 } = {}) => ({
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    createdAt: conversation.createdAt,
    lastMessageAt: conversation.lastMessageAt,
    lastMessage,
    unreadCount,
    members: conversation.members.map(({ role, user }) => ({
      ...toPublicUser(user),
      role,
      isOnline: presence.isOnline(user.id),
    })),
  });

  /** Fixed number of queries regardless of how many conversations (no N+1). */
  const toConversationViews = async (conversations, userId) => {
    const ids = conversations.map(({ id }) => id);
    const [latestMessages, unreadCounts] = await Promise.all([
      messagesRepository.findLatestPerConversation(ids),
      messagesRepository.countUnreadPerConversation(userId, ids),
    ]);
    return conversations.map((conversation) =>
      toConversationView(conversation, {
        lastMessage: latestMessages.get(conversation.id) ?? null,
        unreadCount: unreadCounts.get(conversation.id) ?? 0,
      }),
    );
  };

  const toConversationViewFor = async (conversation, userId) => (await toConversationViews([conversation], userId))[0];

  const announceNew = (conversation) => {
    const view = toConversationView(conversation);
    notifyConversationCreated(view);
    return view;
  };

  const assertUsersExist = async (userIds) => {
    if ((await usersRepository.countByIds(userIds)) !== userIds.length) {
      throw new AppError(400, 'UNKNOWN_USERS', 'One or more users do not exist');
    }
  };

  return {
    async listForUser(userId) {
      return toConversationViews(await conversationsRepository.findAllForUser(userId), userId);
    },

    listIdsForUser: (userId) => conversationsRepository.findIdsForUser(userId),

    async findOrCreateDirect(currentUserId, otherUserId) {
      if (otherUserId === currentUserId) {
        throw new AppError(400, 'INVALID_DIRECT_CHAT', 'You cannot start a direct chat with yourself');
      }
      await assertUsersExist([otherUserId]);

      const directKey = buildDirectKey(currentUserId, otherUserId);
      const existing = await conversationsRepository.findByDirectKey(directKey);
      if (existing) return toConversationViewFor(existing, currentUserId);

      const created = await conversationsRepository.createDirect({
        directKey,
        createdById: currentUserId,
        memberIds: [currentUserId, otherUserId],
      });
      if (created) return announceNew(created);

      // A concurrent request created it first; return that one.
      return toConversationViewFor(await conversationsRepository.findByDirectKey(directKey), currentUserId);
    },

    async createGroup(currentUserId, { name, memberIds }) {
      const otherMemberIds = [...new Set(memberIds)].filter((id) => id !== currentUserId);
      if (otherMemberIds.length < MIN_GROUP_OTHER_MEMBERS) {
        throw new AppError(400, 'GROUP_TOO_SMALL', `A group needs at least ${MIN_GROUP_OTHER_MEMBERS} other members`);
      }
      await assertUsersExist(otherMemberIds);

      return announceNew(
        await conversationsRepository.createGroup({ name, createdById: currentUserId, memberIds: otherMemberIds }),
      );
    },

    async markRead(conversationId, userId) {
      await assertConversationMember(conversationsRepository, conversationId, userId);
      await conversationsRepository.updateLastReadAt(conversationId, userId, new Date());
    },
  };
};
