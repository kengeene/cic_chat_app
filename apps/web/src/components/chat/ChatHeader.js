import Link from 'next/link';
import { ActionIcon, Box, Divider, Group, Text, Title } from '@mantine/core';
import { formatLastSeen } from '@/lib/formatTime';
import { useConversationDisplay } from '@/hooks/useConversationDisplay';
import { ConversationAvatar } from './ConversationAvatar';

const describePresence = ({ isOnline, lastSeenAt }) => (isOnline ? 'Online' : formatLastSeen(lastSeenAt));

export function ChatHeader({ conversation }) {
  const { title, otherMember } = useConversationDisplay(conversation);

  return (
    <>
      <Group component="header" wrap="nowrap" gap="sm" px="md" py="sm">
        <ActionIcon
          component={Link}
          href="/chat"
          variant="subtle"
          color="gray"
          aria-label="Back to conversations"
          hiddenFrom="sm"
        >
          ←
        </ActionIcon>
        <ConversationAvatar title={title} otherMember={otherMember} />
        <Box miw={0}>
          <Title order={1} size="h4" lineClamp={1}>
            {title}
          </Title>
          <Text size="xs" c="dimmed">
            {otherMember ? describePresence(otherMember) : `${conversation.members.length} members`}
          </Text>
        </Box>
      </Group>
      <Divider />
    </>
  );
}
