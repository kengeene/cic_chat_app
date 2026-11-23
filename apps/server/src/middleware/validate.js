import { parseOrThrow } from '../lib/validation.js';

/**
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 * Parsed values are exposed as req.validated.{body,query,params} (Express 5 makes req.query read-only).
 */
export const validate = (schemas) => (req, res, next) => {
  req.validated = Object.fromEntries(
    Object.entries(schemas).map(([part, schema]) => [part, parseOrThrow(schema, req[part])]),
  );
  next();
};
