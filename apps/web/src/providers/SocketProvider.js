'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { socket } from '@/lib/socketClient';
import { useAuth } from './AuthProvider';
import { useRealtimeCacheSync } from '@/hooks/useRealtimeCacheSync';

const SocketContext = createContext(null);

/** Connects while signed in and exposes the connection status: connecting | connected | reconnecting | disconnected. */
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [status, setStatus] = useState('connecting');
  useRealtimeCacheSync(socket, userId);

  useEffect(() => {
    if (!userId) return;
    const handleConnect = () => setStatus('connected');
    // `active` means socket.io will keep retrying on its own.
    const handleConnectionLost = () => setStatus(socket.active ? 'reconnecting' : 'disconnected');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleConnectionLost);
    socket.on('connect_error', handleConnectionLost);
    socket.connect();
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleConnectionLost);
      socket.off('connect_error', handleConnectionLost);
      socket.disconnect();
    };
  }, [userId]);

  const value = useMemo(() => ({ socket, status }), [status]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
