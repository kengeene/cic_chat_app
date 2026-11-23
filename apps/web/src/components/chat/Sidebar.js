import { Avatar, Button, Divider, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { ConversationList } from './ConversationList';
import { NewChatModal } from './NewChatModal';

export function Sidebar() {
  const { user, logout } = useAuth();
  const [isNewChatOpen, newChat] = useDisclosure(false);

  return (
    <Stack h="100%" gap={0}>
      <Group justify="space-between" wrap="nowrap" px="md" py="sm">
        <Group gap="xs" wrap="nowrap" miw={0}>
          <Avatar name={user.displayName} color="gray" size="sm" />
          <Text size="sm" fw={600} truncate>
            {user.displayName}
          </Text>
        </Group>
        <Button variant="subtle" color="gray" size="xs" onClick={logout}>
          Sign out
        </Button>
      </Group>
      <Divider />
      <Button m="sm" onClick={newChat.open}>
        New chat
      </Button>
      <ScrollArea flex={1} px="xs">
        <ConversationList />
      </ScrollArea>
      <NewChatModal opened={isNewChatOpen} onClose={newChat.close} />
    </Stack>
  );
}
