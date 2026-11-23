import { z } from 'zod';

export const searchUsersRequest = {
  query: z.object({ search: z.string().trim().max(100).default('') }),
};
