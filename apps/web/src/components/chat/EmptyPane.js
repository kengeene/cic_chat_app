'use client';

import Link from 'next/link';
import { Anchor, Center, Stack, Text } from '@mantine/core';

export function EmptyPane({ title, description, showBackLink = false }) {
  return (
    <Center flex={1} p="lg">
      <Stack align="center" gap={4} ta="center">
        <Text fw={500}>{title}</Text>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        {showBackLink && (
          <Anchor component={Link} href="/chat" size="sm" hiddenFrom="sm">
            Back to conversations
          </Anchor>
        )}
      </Stack>
    </Center>
  );
}
