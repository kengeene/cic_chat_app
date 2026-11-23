import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

const REQUEST_ID_HEADER = 'x-request-id';
const VALID_REQUEST_ID = /^[\w-]{1,64}$/;

/** Reuses a well-formed incoming request id (e.g. from a proxy), otherwise generates one; echoes it back. */
const resolveRequestId = (req, res) => {
  const incomingId = req.headers[REQUEST_ID_HEADER];
  const id = VALID_REQUEST_ID.test(incomingId ?? '') ? incomingId : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
};

// Explicit serializers: headers (cookies) and bodies (passwords, messages) are never logged.
export const requestLogger = pinoHttp({
  logger,
  genReqId: resolveRequestId,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
