'use client';

import { useEffect } from 'react';
import { useRouter, useSelectedLayoutSegment } from 'next/navigation';
import { AppShell, Center, Flex, Loader } from '@mantine/core';
import { useAuth } from '@/providers/AuthProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { ConnectionBanner } from '@/components/chat/ConnectionBanner';
import { Sidebar } from '@/components/chat/Sidebar';

export default function ChatLayout({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  // On mobile only one pane shows: the list, or the open conversation.
  const isConversationOpen = useSelectedLayoutSegment() !== null;

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (!user) {
    return (
      <Center h="100dvh">
        <Loader />
      </Center>
    );
  }

  return (
    <SocketProvider>
      <ConnectionBanner />
      <AppShell padding={0} navbar={{ width: 320, breakpoint: 'sm', collapsed: { mobile: isConversationOpen } }}>
        <AppShell.Navbar>
          <Sidebar />
        </AppShell.Navbar>
        <AppShell.Main h="100dvh">
          <Flex direction="column" h="100%">
            {children}
          </Flex>
        </AppShell.Main>
      </AppShell>
    </SocketProvider>
  );
}
