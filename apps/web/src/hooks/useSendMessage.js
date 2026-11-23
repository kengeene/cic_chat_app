import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CLIENT_EVENTS } from '@/lib/events';
import { applyIncomingMessage, setPendingMessageStatus, upsertMessage } from '@/lib/chatCache';
import { useAuth } from '@/providers/AuthProvider';
import { useSocket } from '@/providers/SocketProvider';

const ACK_TIMEOUT_MS = 5000;

const emitSend = (socket, payload) =>
  new Promise((resolve, reject) => {
    socket.timeout(ACK_TIMEOUT_MS).emit(CLIENT_EVENTS.MESSAGE_SEND, payload, (timeoutError, response) => {
      if (timeoutError) return reject(timeoutError);
      if (!response?.ok) return reject(new Error(response?.error?.message ?? 'Message rejected'));
      return resolve(response.message);
    });
  });

/** Optimistic send: the message shows as "sending" until the server acks it, or "failed" with a retry. */
export const useSendMessage = (conversationId) => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useAuth();

  const deliver = useCallback(
    async ({ clientMsgId, body }) => {
      try {
        const message = await emitSend(socket, { conversationId, clientMsgId, body });
        applyIncomingMessage(queryClient, message, user.id);
      } catch {
        setPendingMessageStatus(queryClient, conversationId, clientMsgId, 'failed');
      }
    },
    [socket, queryClient, conversationId, user.id],
  );

  const send = useCallback(
    (body) => {
      const clientMsgId = crypto.randomUUID();
      const optimisticMessage = {
        id: clientMsgId,
        clientMsgId,
        conversationId,
        senderId: user.id,
        body,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };
      upsertMessage(queryClient, optimisticMessage);
      return deliver(optimisticMessage);
    },
    [queryClient, conversationId, user.id, deliver],
  );

  /** Re-sends with the same clientMsgId so the server can deduplicate. */
  const retry = useCallback(
    (message) => {
      setPendingMessageStatus(queryClient, conversationId, message.clientMsgId, 'sending');
      return deliver(message);
    },
    [queryClient, conversationId, deliver],
  );

  return { send, retry };
};
