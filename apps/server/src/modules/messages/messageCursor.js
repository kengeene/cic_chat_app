import { z } from 'zod';
import { AppError } from '../../lib/AppError.js';

const cursorSchema = z.object({ createdAt: z.iso.datetime(), id: z.uuid() });

/** Opaque cursor pointing at the oldest message of a page: (createdAt, id) breaks timestamp ties. */
export const encodeCursor = ({ createdAt, id }) =>
  Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString('base64url');

export const decodeCursor = (cursor) => {
  try {
    const { createdAt, id } = cursorSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
    return { createdAt: new Date(createdAt), id };
  } catch {
    throw new AppError(400, 'INVALID_CURSOR', 'Invalid pagination cursor');
  }
};
