import { AppError } from '../lib/AppError.js';

export const notFound = (req, res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found'));
