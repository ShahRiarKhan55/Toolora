import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config';
import { createLogger } from './logger';
import { createProductionApp } from './productionApp';

// Vercel entry: the bundle exports the Express app instead of listening. The bundle lives at
// apps/server/dist/vercel.js, so the built web app is two directories up, whatever the cwd is.
// Static assets are served by Vercel's CDN from public/ (express.static is ignored there); only
// index.html is read from here, for server-side SEO injection. Stateless: no database is written.
const config = loadConfig();
const logger = createLogger({ level: config.logLevel, json: config.nodeEnv === 'production' });
const webDistDir = resolve(fileURLToPath(import.meta.url), '../../../web/dist');

export default createProductionApp(config, logger, webDistDir).app;
