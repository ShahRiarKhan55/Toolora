import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ACCOUNTS_ENABLED } from '@toolora/shared';
import type { Express } from 'express';
import { createApp } from './app';
import type { Config } from './config';
import { createDatabase } from './db';
import type { Database } from './db';
import type { Logger } from './logger';

/** The production wiring shared by the long-running server (index.ts) and the Vercel function
 *  (vercel.ts). `webDistDir` is used only if it holds a built index.html. */
export function createProductionApp(
  config: Config,
  logger: Logger,
  webDistDir: string,
): { app: Express; db: Database } {
  // The client is lazy: SQLite is not opened until a query runs, and none runs while accounts are closed.
  const db = createDatabase(config.databaseUrl);
  const app = createApp({
    logger,
    db,
    accountsEnabled: ACCOUNTS_ENABLED,
    secureCookies: config.nodeEnv === 'production',
    publicSiteOrigin: config.publicSiteOrigin,
    webDistDir: existsSync(join(webDistDir, 'index.html')) ? webDistDir : undefined,
  });
  return { app, db };
}
