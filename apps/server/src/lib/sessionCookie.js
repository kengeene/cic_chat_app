import { env } from '../config/env.js';
import { SESSION_TTL_SECONDS } from './jwt.js';

export const SESSION_COOKIE = 'cic_session';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export const setSessionCookie = (res, token) =>
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_TTL_SECONDS * 1000 });

export const clearSessionCookie = (res) => res.clearCookie(SESSION_COOKIE, cookieOptions);
