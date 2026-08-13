import cors from 'cors';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';
import apiRouter from './routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());

  const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: allowedOrigins.includes('*') ? true : allowedOrigins,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  app.use(generalRateLimiter);

  app.get('/', (_req, res) => {
    res.json({ name: 'AI Video Summarizer API', status: 'running' });
  });

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
