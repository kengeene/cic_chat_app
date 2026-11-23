import rateLimit from 'express-rate-limit';
import { AppError } from '../lib/AppError.js';

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new AppError(429, 'RATE_LIMITED', 'Too many login attempts. Try again in a minute.')),
});
