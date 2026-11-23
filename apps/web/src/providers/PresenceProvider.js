'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { EVENTS } from '@/lib/events';
import { useConversations } from '@/hooks/useConversations';
import { useSocket } from './SocketProvider';

const PresenceContext = createContext({});
const OFFLINE = Object.freeze({ isOnline: false, lastSeenAt: null });

const presenceFromConversations = (conversations = []) =>
  Object.fromEntries(
    conversations.flatMap(({ members }) =>
      members.map(({ id, isOnline, lastSeenAt }) => [id, { isOnline, lastSeenAt }]),
    ),
  );

export function PresenceProvider({ children }) {
  const { socket } = useSocket();
  const { data: conversations } = useConversations();
  const [liveUpdates, setLiveUpdates] = useState({});

  useEffect(() => {
    const handlePresenceUpdate = ({ userId, isOnline, lastSeenAt }) =>
      setLiveUpdates((previous) => ({ ...previous, [userId]: { isOnline, lastSeenAt } }));
    // After a reconnect the conversations refetch is the source of truth again.
    const handleConnect = () => setLiveUpdates({});

    socket.on(EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on('connect', handleConnect);
    return () => {
      socket.off(EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
      socket.off('connect', handleConnect);
    };
  }, [socket]);

  const presenceByUserId = useMemo(
    () => ({ ...presenceFromConversations(conversations), ...liveUpdates }),
    [conversations, liveUpdates],
  );

  return <PresenceContext.Provider value={presenceByUserId}>{children}</PresenceContext.Provider>;
}

export const usePresence = (userId) => useContext(PresenceContext)[userId] ?? OFFLINE;
