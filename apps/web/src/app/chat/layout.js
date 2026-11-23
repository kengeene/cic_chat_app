'use client';

import { useEffect } from 'react';
import { useRouter, useSelectedLayoutSegment } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { PresenceProvider } from '@/providers/PresenceProvider';
import { ConnectionBanner } from '@/components/chat/ConnectionBanner';
import { Sidebar } from '@/components/chat/Sidebar';

export default function ChatLayout({ children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  // On mobile only one pane is visible: the list, or the open conversation.
  const isConversationOpen = useSelectedLayoutSegment() !== null;

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (!user) {
    return <p className="flex h-dvh items-center justify-center text-sm text-slate-500">Loading…</p>;
  }

  return (
    <SocketProvider>
      <PresenceProvider>
        <div className="flex h-dvh flex-col bg-white">
          <ConnectionBanner />
          <div className="flex min-h-0 flex-1">
            <div className={`${isConversationOpen ? 'hidden' : 'flex'} w-full md:flex md:w-80 md:shrink-0`}>
              <Sidebar />
            </div>
            <main className={`${isConversationOpen ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col md:flex`}>
              {children}
            </main>
          </div>
        </div>
      </PresenceProvider>
    </SocketProvider>
  );
}
