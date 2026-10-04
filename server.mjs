// Vercel entry point (zero-config Express detection looks for a root app/index/server file that
// imports express and default-exports the app). The app itself is bundled by `npm run build`;
// see docs/deployment.md, "Vercel".
import 'express';

export { default } from './apps/server/dist/vercel.js';
