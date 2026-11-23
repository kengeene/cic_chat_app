import { AppError } from '../../lib/AppError.js';

/** Shared permission rule: only members may read or write a conversation. */
export const assertConversationMember = async (conversationsRepository, conversationId, userId) => {
  const membership = await conversationsRepository.findMembership(conversationId, userId);
  if (!membership) throw new AppError(403, 'NOT_A_MEMBER', 'You are not a member of this conversation');
};
