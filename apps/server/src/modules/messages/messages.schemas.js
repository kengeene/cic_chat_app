import { z } from 'zod';
import { conversationIdParams } from '../conversations/conversations.schemas.js';

export const listMessagesRequest = {
  params: conversationIdParams,
  query: z.object({
    cursor: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
};

// Body length rules live in messagesService so every caller gets them.
export const sendMessagePayload = z.object({
  conversationId: z.uuid(),
  body: z.string(),
  clientMsgId: z.string().min(1).max(64),
});
