import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import type { Database } from './db';
import type { Logger } from './logger';
import { errorHandler, routeNotFound } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { healthRouter } from './routes/health';
import { seoRouter } from './routes/seo';

export interface AppDeps {
  logger: Logger;
  db: Pick<Database, 'ping'>;
  /** The configured production origin; omit or pass undefined when none is set yet (e.g. in tests
   *  and local development) — see `config.ts` and `routes/seo.ts`. */
  publicSiteOrigin?: string;
}

/** Builds the Express app without listening, so tests can drive it directly with supertest. */
export function createApp({ logger, db, publicSiteOrigin }: AppDeps): Express {
  const app = express();

  app.use(helmet());
  app.use(requestLogger(logger));
  app.use(express.json({ limit: '100kb' }));

  app.use(seoRouter({ publicSiteOrigin }));
  app.use('/api', healthRouter({ db, logger }));

  app.use(routeNotFound);
  app.use(errorHandler(logger));

  return app;
}
