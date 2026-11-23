import { AppError } from '../../lib/AppError.js';
import { logger } from '../../lib/logger.js';

const toErrorBody = (error) => {
  if (error instanceof AppError) return { code: error.code, message: error.message };
  logger.error({ err: error }, 'Unhandled socket handler error');
  return { code: 'INTERNAL_ERROR', message: 'Something went wrong' };
};

/**
 * Wraps an ack-style socket handler so it never throws and always acks exactly once:
 * { ok: true, ...result } on success, { ok: false, error: { code, message } } on failure.
 */
export const withAck = (handler) => async (payload, ack) => {
  const respond = typeof ack === 'function' ? ack : () => {};
  try {
    respond({ ok: true, ...(await handler(payload)) });
  } catch (error) {
    respond({ ok: false, error: toErrorBody(error) });
  }
};
