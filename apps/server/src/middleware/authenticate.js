import { AppError } from '../lib/AppError.js';
import { verifySessionToken } from '../lib/jwt.js';
import { SESSION_COOKIE } from '../lib/sessionCookie.js';

export const authenticate = (req, res, next) => {
  const userId = verifySessionToken(req.cookies[SESSION_COOKIE]);
  if (!userId) return next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in'));

  req.user = { id: userId };
  return next();
};
