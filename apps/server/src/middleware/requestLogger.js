import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

const assignRequestId = (req, res) => {
  const id = randomUUID();
  res.setHeader('x-request-id', id);
  return id;
};

// Explicit serializers: headers (cookies) and bodies (passwords, messages) are never logged.
export const requestLogger = pinoHttp({
  logger,
  genReqId: assignRequestId,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
