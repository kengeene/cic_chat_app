import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SERVER_EVENTS } from '@/lib/events';
import { queryKeys } from '@/lib/queryKeys';
import { applyIncomingMessage, applyPresenceUpdate, upsertConversation } from '@/lib/chatCache';

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
    const handlePresenceUpdate = (update) => applyPresenceUpdate(queryClient, update);

    socket.on('connect', handleConnect);
    socket.on(SERVER_EVENTS.MESSAGE_NEW, handleMessageNew);
    socket.on(SERVER_EVENTS.CONVERSATION_NEW, handleConversationNew);
    socket.on(SERVER_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
    return () => {
      socket.off('connect', handleConnect);
      socket.off(SERVER_EVENTS.MESSAGE_NEW, handleMessageNew);
      socket.off(SERVER_EVENTS.CONVERSATION_NEW, handleConversationNew);
      socket.off(SERVER_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
    };
  }, [socket, currentUserId, queryClient]);
};
