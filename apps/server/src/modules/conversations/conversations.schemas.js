import { z } from 'zod';

export const conversationIdParams = z.object({ id: z.uuid() });

export const createDirectRequest = {
  body: z.object({ userId: z.uuid() }),
};

export const createGroupRequest = {
  body: z.object({
    name: z.string().trim().min(1).max(80),
    memberIds: z.array(z.uuid()).min(2).max(100),
  }),
};

export const markReadRequest = {
  params: conversationIdParams,
};
