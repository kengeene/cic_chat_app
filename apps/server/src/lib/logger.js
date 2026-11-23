import pino from 'pino';
import { env } from '../config/env.js';

// Defence in depth: these never belong in logs, even if a future log call includes them by accident.
const REDACTED_PATHS = ['password', '*.password', 'passwordHash', '*.passwordHash', 'body', '*.body', '*.cookie', '*.headers.cookie'];

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
});
