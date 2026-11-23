import { useParams } from 'next/navigation';
import { Skeleton, Stack, Text } from '@mantine/core';
import { useConversations } from '@/hooks/useConversations';
import { ConversationListItem } from './ConversationListItem';
import { LoadError } from './LoadError';

const SKELETON_ROWS = 6;

export function ConversationList() {
  const { data: conversations, isPending, isError, refetch } = useConversations();
  const { conversationId: activeConversationId } = useParams();

  if (isPending) {
    return (
      <Stack gap="xs" p="xs" aria-hidden="true">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} height={52} />
        ))}
      </Stack>
    );
  }
  if (isError) return <LoadError title="Couldn't load conversations" onRetry={refetch} />;
  if (conversations.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" p="lg">
        No conversations yet. Start one with “New chat”.
      </Text>
    );
  }

  return (
    <nav aria-label="Conversations">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeConversationId}
        />
      ))}
    </nav>
  );
}
