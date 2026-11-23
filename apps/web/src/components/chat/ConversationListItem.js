import Link from 'next/link';
import { Badge, NavLink, Stack, Text } from '@mantine/core';
import { formatListTimestamp } from '@/lib/formatTime';
import { useConversationDisplay } from '@/hooks/useConversationDisplay';
import { ConversationAvatar } from './ConversationAvatar';

export function ConversationListItem({ conversation, isActive }) {
  const { title, otherMember } = useConversationDisplay(conversation);
  const { lastMessage, unreadCount } = conversation;

  return (
    <NavLink
      component={Link}
      href={`/chat/${conversation.id}`}
      active={isActive}
      aria-current={isActive ? 'page' : undefined}
      noWrap
      leftSection={<ConversationAvatar title={title} otherMember={otherMember} />}
      label={
        <Text size="sm" fw={unreadCount > 0 ? 700 : 500} truncate>
          {title}
        </Text>
      }
      description={lastMessage?.body ?? 'No messages yet'}
      rightSection={
        <Stack gap={4} align="flex-end">
          {lastMessage && (
            <Text size="xs" c="dimmed">
              {formatListTimestamp(lastMessage.createdAt)}
            </Text>
          )}
          {unreadCount > 0 && (
            <Badge size="sm" circle aria-label={`${unreadCount} unread`}>
              {unreadCount}
            </Badge>
          )}
        </Stack>
      }
    />
  );
}
