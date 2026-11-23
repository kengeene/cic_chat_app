import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Box, Button, Divider, Skeleton, Stack, Text } from '@mantine/core';
import { formatDayLabel, isSameDay } from '@/lib/formatTime';
import { useMessages } from '@/hooks/useMessages';
import { useConversationDisplay } from '@/hooks/useConversationDisplay';
import { useAuth } from '@/providers/AuthProvider';
import { EmptyPane } from './EmptyPane';
import { LoadError } from './LoadError';
import { MessageBubble } from './MessageBubble';

// Virtuoso keeps the viewport still when firstItemIndex drops by the number of prepended (older) messages.
const FIRST_ITEM_INDEX_BASE = 1_000_000;
const NEAR_BOTTOM_PX = 120;
const GROUPING_WINDOW_MS = 5 * 60 * 1000;
const SKELETON_WIDTHS = ['40%', '60%', '35%', '55%', '45%'];

const startsNewDay = (message, previous) => !previous || !isSameDay(previous.createdAt, message.createdAt);

const startsNewGroup = (message, previous) =>
  startsNewDay(message, previous) ||
  previous.senderId !== message.senderId ||
  new Date(message.createdAt) - new Date(previous.createdAt) > GROUPING_WINDOW_MS;

const findLastConfirmedId = (messages, senderId) =>
  messages.findLast((message) => message.senderId === senderId && !message.status)?.id;

function LoadOlderButton({ context: { hasOlder, isLoadingOlder, isLoadOlderError, loadOlder } }) {
  if (!hasOlder) return null;
  return (
    <Stack align="center" gap={4} py="sm">
      <Button variant="default" size="xs" loading={isLoadingOlder} onClick={() => loadOlder()}>
        Load older messages
      </Button>
      {isLoadOlderError && (
        <Text size="xs" c="red">
          Couldn&apos;t load older messages.
        </Text>
      )}
    </Stack>
  );
}

const VIRTUOSO_COMPONENTS = { Header: LoadOlderButton };

export function MessageList({ conversation, onRetry }) {
  const { user } = useAuth();
  const { title } = useConversationDisplay(conversation);
  const { messages, olderMessageCount, isPending, isError, retry, ...olderPages } = useMessages(conversation.id);
  const memberNames = useMemo(
    () => new Map(conversation.members.map(({ id, displayName }) => [id, displayName])),
    [conversation.members],
  );

  if (isPending) {
    return (
      <Stack flex={1} p="md" aria-hidden="true">
        {SKELETON_WIDTHS.map((width, index) => (
          <Skeleton key={width} height={36} width={width} radius="lg" ml={index % 2 ? 'auto' : 0} />
        ))}
      </Stack>
    );
  }
  if (isError) return <LoadError title="Couldn't load messages" onRetry={retry} />;
  if (messages.length === 0) return <EmptyPane title="No messages yet" description="Say hello 👋" />;

  const firstItemIndex = FIRST_ITEM_INDEX_BASE - olderMessageCount;
  const lastConfirmedMineId = findLastConfirmedId(messages, user.id);

  const renderMessage = (index, message) => {
    const previous = messages[index - firstItemIndex - 1];
    const isMine = message.senderId === user.id;
    return (
      <>
        {startsNewDay(message, previous) && <Divider my="sm" label={formatDayLabel(message.createdAt)} />}
        <MessageBubble
          message={message}
          isMine={isMine}
          senderName={memberNames.get(message.senderId) ?? 'Former member'}
          isFirstInGroup={startsNewGroup(message, previous)}
          showSenderName={conversation.type === 'group' && !isMine}
          showSent={message.id === lastConfirmedMineId}
          onRetry={onRetry}
        />
      </>
    );
  };

  return (
    <Box role="log" aria-label={`Messages in ${title}`} flex={1} mih={0}>
      <Virtuoso
        style={{ height: '100%' }}
        data={messages}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={messages.length - 1}
        followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
        atBottomThreshold={NEAR_BOTTOM_PX}
        computeItemKey={(_, message) => message.id}
        context={olderPages}
        components={VIRTUOSO_COMPONENTS}
        itemContent={renderMessage}
      />
    </Box>
  );
}
