import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EVENTS } from '@/lib/events';
import { queryKeys } from '@/lib/queryKeys';
import { applyIncomingMessage, upsertConversation } from '@/lib/chatCache';

/** Applies server push events to the React Query cache and refetches after a reconnect to fill gaps. */
export const useRealtimeCacheSync = (socket, currentUserId) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUserId) return;
    let hasConnectedBefore = false;

    const handleConnect = () => {
      if (hasConnectedBefore) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        queryClient.invalidateQueries({ queryKey: queryKeys.allMessages });
      }
      hasConnectedBefore = true;
    };
    const handleMessageNew = (message) => applyIncomingMessage(queryClient, message, currentUserId);
    const handleConversationNew = (conversation) => upsertConversation(queryClient, conversation);

    socket.on('connect', handleConnect);
    socket.on(EVENTS.MESSAGE_NEW, handleMessageNew);
    socket.on(EVENTS.CONVERSATION_NEW, handleConversationNew);
    return () => {
      socket.off('connect', handleConnect);
      socket.off(EVENTS.MESSAGE_NEW, handleMessageNew);
      socket.off(EVENTS.CONVERSATION_NEW, handleConversationNew);
    };
  }, [socket, currentUserId, queryClient]);
};
