import { useAuth } from '@/providers/AuthProvider';

/** Title and (for direct chats) the other participant, as seen by the current user. */
export const useConversationDisplay = (conversation) => {
  const { user } = useAuth();

  if (conversation.type === 'group') return { title: conversation.name, otherMember: null };

  const otherMember = conversation.members.find(({ id }) => id !== user.id);
  return { title: otherMember?.displayName ?? 'Unknown user', otherMember };
};
