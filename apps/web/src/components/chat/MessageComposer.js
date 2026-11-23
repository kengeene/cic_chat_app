import { useState } from 'react';
import { Button, Group, Textarea } from '@mantine/core';

export function MessageComposer({ onSend }) {
  const [body, setBody] = useState('');
  const canSend = body.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(body.trim());
    setBody('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group align="flex-end" gap="xs" wrap="nowrap" p="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <Textarea
          aria-label="Message"
          placeholder="Write a message…  (Shift+Enter for a new line)"
          autosize
          minRows={1}
          maxRows={6}
          flex={1}
          value={body}
          onChange={(event) => setBody(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Button type="submit" disabled={!canSend}>
          Send
        </Button>
      </Group>
    </form>
  );
}
