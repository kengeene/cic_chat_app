import { useEffect, useState } from 'react';

/** @returns {'connecting' | 'connected' | 'reconnecting' | 'disconnected'} */
export const useSocketStatus = (socket) => {
  const [status, setStatus] = useState(socket.connected ? 'connected' : 'connecting');

  useEffect(() => {
    const handleConnect = () => setStatus('connected');
    // `active` means socket.io will keep retrying on its own.
    const handleConnectionLost = () => setStatus(socket.active ? 'reconnecting' : 'disconnected');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleConnectionLost);
    socket.on('connect_error', handleConnectionLost);
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleConnectionLost);
      socket.off('connect_error', handleConnectionLost);
    };
  }, [socket]);

  return status;
};
