import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const SESSION_TTL_SECONDS = 8 * 60 * 60;
const ALGORITHM = 'HS256';

export const signSessionToken = (userId) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS, algorithm: ALGORITHM });

/** @returns {string | null} the user id, or null when the token is missing, invalid or expired */
export const verifySessionToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] }).sub ?? null;
  } catch {
    return null;
  }
};
