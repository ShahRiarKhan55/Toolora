import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE_NAME } from '@toolora/shared';
import { loadConfig } from './config';
import { createLogger } from './logger';
import { createProductionApp } from './productionApp';

function main(): void {
  // Optional local overrides; always run from the repository root (see .env.example).
  if (existsSync('.env')) process.loadEnvFile('.env');

  const config = loadConfig();
  const logger = createLogger({ level: config.logLevel, json: config.nodeEnv === 'production' });
  // Run from the repository root (see .env.example). Absent in dev, where Vite serves the web app.
  const { app, db } = createProductionApp(config, logger, resolve('apps/web/dist'));

  const server = app.listen(config.port, () => {
    logger.info(`${SITE_NAME} server listening`, { port: config.port, env: config.nodeEnv });
  });

  server.on('error', (err) => {
    logger.error('Server failed to start', { err });
    process.exit(1);
  });

  const shutdown = (signal: string) => {
    logger.info('Shutting down', { signal });
    // Force-exit if open connections do not drain in time.
    setTimeout(() => process.exit(1), 10_000).unref();
    server.close(() => {
      void db.close().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { err: reason });
    process.exit(1);
  });
}

try {
  main();
} catch (err) {
  // Startup errors (e.g. invalid environment) are for the operator: print plainly and exit.
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
