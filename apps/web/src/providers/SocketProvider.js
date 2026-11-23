'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { socket } from '@/lib/socketClient';
import { useAuth } from './AuthProvider';
import { useSocketStatus } from '@/hooks/useSocketStatus';
import { useRealtimeCacheSync } from '@/hooks/useRealtimeCacheSync';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const status = useSocketStatus(socket);
  useRealtimeCacheSync(socket, userId);

  useEffect(() => {
    if (!userId) return;
    socket.connect();
    return () => socket.disconnect();
  }, [userId]);

  const value = useMemo(() => ({ socket, status }), [status]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
