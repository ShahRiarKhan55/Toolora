import { Router } from 'express';
import type { Database } from '../db';
import type { Logger } from '../logger';

export function healthRouter({
  db,
  logger,
  checkDatabase = true,
}: {
  db: Pick<Database, 'ping'>;
  logger: Logger;
  /** False while nothing uses the database (accounts closed), so a host without a writable,
   *  persistent filesystem (Vercel) is not reported degraded for a database it never needs. */
  checkDatabase?: boolean;
}): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    let databaseOk = true;
    if (checkDatabase) {
      try {
        await db.ping();
      } catch (err) {
        databaseOk = false;
        logger.error('Database health check failed', { err });
      }
    }

    res.status(databaseOk ? 200 : 503).json({
      status: databaseOk ? 'ok' : 'degraded',
      database: !checkDatabase ? 'not-used' : databaseOk ? 'ok' : 'unavailable',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  return router;
}
