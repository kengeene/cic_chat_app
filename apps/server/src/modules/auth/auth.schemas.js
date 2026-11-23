import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
// bcrypt only uses the first 72 bytes of a password.
const MAX_PASSWORD_LENGTH = 72;

export const registerRequest = {
  body: z.object({
    email,
    displayName: z.string().trim().min(1).max(80),
    password: z.string().min(8).max(MAX_PASSWORD_LENGTH),
  }),
};

export const loginRequest = {
  body: z.object({
    email,
    password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
  }),
};
