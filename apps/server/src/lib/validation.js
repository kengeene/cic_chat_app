import { AppError } from './AppError.js';

const describeIssue = ({ path, message }) => (path.length ? `${path.join('.')}: ${message}` : message);

/** Parses input with a zod schema, throwing a 400 AppError on failure. Shared by REST and socket handlers. */
export const parseOrThrow = (schema, input) => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', result.error.issues.map(describeIssue).join('; '));
  }
  return result.data;
};
