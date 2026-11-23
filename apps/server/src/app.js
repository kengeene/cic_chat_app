import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { createApiRouter } from './routes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = (services) => {
  const app = express();

  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', createApiRouter(services));

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
