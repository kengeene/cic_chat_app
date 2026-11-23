import { AppError } from '../lib/AppError.js';
import { logger } from '../lib/logger.js';

const sendError = (res, statusCode, code, message) =>
  res.status(statusCode).json({ error: { code, message } });

/** Express-generated client errors (e.g. malformed JSON body) carry `status` and `expose`. */
const isExposableHttpError = (err) => err.expose === true && err.status < 500;

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message);
  }
  if (isExposableHttpError(err)) {
    return sendError(res, err.status, 'BAD_REQUEST', err.message);
  }
  logger.error({ err }, 'Unhandled error');
  return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
};
