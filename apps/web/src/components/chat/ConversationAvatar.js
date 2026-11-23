import { Avatar, Indicator, VisuallyHidden } from '@mantine/core';

/** Initials avatar; direct chats also show the other person's online status. */
export function ConversationAvatar({ title, otherMember }) {
  const avatar = <Avatar name={title} color="gray" />;
  if (!otherMember) return avatar;

  return (
    <Indicator position="bottom-end" offset={6} size={12} withBorder color={otherMember.isOnline ? 'teal' : 'gray'}>
      {avatar}
      <VisuallyHidden>{otherMember.isOnline ? 'Online' : 'Offline'}</VisuallyHidden>
    </Indicator>
  );
}
