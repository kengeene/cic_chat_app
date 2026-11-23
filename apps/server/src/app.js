import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { AppError } from './lib/AppError.js';
import { apiRouter } from './routes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', apiRouter);

app.use((req, res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));
app.use(errorHandler);
