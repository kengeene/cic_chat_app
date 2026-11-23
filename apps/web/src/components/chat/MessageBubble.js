import { Anchor, Group, Paper, Stack, Text } from '@mantine/core';
import { formatTime } from '@/lib/formatTime';

function MessageStatus({ message, showSent, onRetry }) {
  if (message.status === 'sending') {
    return (
      <Text size="xs" c="dimmed">
        Sending…
      </Text>
    );
  }
  if (message.status === 'failed') {
    return (
      <Text size="xs" c="red">
        Failed to send ·{' '}
        <Anchor component="button" type="button" size="xs" c="red" fw={600} onClick={() => onRetry(message)}>
          Retry
        </Anchor>
      </Text>
    );
  }
  return showSent ? (
    <Text size="xs" c="dimmed">
      Sent
    </Text>
  ) : null;
}

export function MessageBubble({ message, isMine, senderName, isFirstInGroup, showSenderName, showSent, onRetry }) {
  return (
    <Stack gap={2} align={isMine ? 'flex-end' : 'flex-start'} px="md" pt={isFirstInGroup ? 'sm' : 2}>
      {isFirstInGroup && (
        <Group gap="xs">
          {showSenderName && (
            <Text size="xs" fw={600}>
              {senderName}
            </Text>
          )}
          <Text component="time" dateTime={message.createdAt} size="xs" c="dimmed">
            {formatTime(message.createdAt)}
          </Text>
        </Group>
      )}
      <Paper
        px="sm"
        py={6}
        radius="lg"
        maw="75%"
        withBorder={!isMine}
        bg={isMine ? 'var(--mantine-primary-color-filled)' : 'white'}
        opacity={message.status === 'sending' ? 0.7 : 1}
      >
        <Text size="sm" c={isMine ? 'white' : undefined} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {message.body}
        </Text>
      </Paper>
      {isMine && <MessageStatus message={message} showSent={showSent} onRetry={onRetry} />}
    </Stack>
  );
}
