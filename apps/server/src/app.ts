import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import type { Database } from './db';
import type { Logger } from './logger';
import { errorHandler, routeNotFound } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { healthRouter } from './routes/health';
import { seoRouter } from './routes/seo';
import { spaRouter } from './routes/spa';

export interface AppDeps {
  logger: Logger;
  db: Pick<Database, 'ping'>;
  /** The configured production origin; omit or pass undefined when none is set yet (e.g. in tests
   *  and local development) — see `config.ts` and `routes/seo.ts`. */
  publicSiteOrigin?: string;
  /** The built web app (apps/web/dist). Omit when it has not been built (dev, API-only tests): the
   *  server then serves only the API and SEO files. */
  webDistDir?: string;
}

/** Builds the Express app without listening, so tests can drive it directly with supertest. */
export function createApp({ logger, db, publicSiteOrigin, webDistDir }: AppDeps): Express {
  const app = express();

  app.use(helmet());
  // helmet has no Permissions-Policy; no tool needs any of these browser features.
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  });
  app.use(requestLogger(logger));
  app.use(express.json({ limit: '100kb' }));

  app.use(seoRouter({ publicSiteOrigin }));
  // API responses are live state, never cacheable.
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', healthRouter({ db, logger }));
  if (webDistDir !== undefined) app.use(spaRouter({ webDistDir, publicSiteOrigin }));

  app.use(routeNotFound);
  app.use(errorHandler(logger));

  return app;
}
