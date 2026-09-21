import { Router } from 'express';
import type { Database } from '../db';
import type { Logger } from '../logger';

export function healthRouter({
  db,
  logger,
}: {
  db: Pick<Database, 'ping'>;
  logger: Logger;
}): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    let databaseOk = true;
    try {
      await db.ping();
    } catch (err) {
      databaseOk = false;
      logger.error('Database health check failed', { err });
    }

    res.status(databaseOk ? 200 : 503).json({
      status: databaseOk ? 'ok' : 'degraded',
      database: databaseOk ? 'ok' : 'unavailable',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  return router;
}
