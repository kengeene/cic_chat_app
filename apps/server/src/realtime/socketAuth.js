import { parseCookie } from 'cookie';
import { verifySessionToken } from '../lib/jwt.js';
import { SESSION_COOKIE } from '../lib/sessionCookie.js';

/** Socket.IO middleware: authenticates the handshake with the same httpOnly session cookie as REST. */
export const socketAuth = (socket, next) => {
  const cookies = parseCookie(socket.handshake.headers.cookie ?? '');
  const userId = verifySessionToken(cookies[SESSION_COOKIE]);
  if (!userId) return next(new Error('UNAUTHENTICATED'));

  socket.data.userId = userId;
  return next();
};
