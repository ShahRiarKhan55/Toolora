// Vercel serves static files from public/ (express.static is ignored there). Copy the built web app
// there, minus index.html: that must keep going through Express so each route gets its SEO tags.
import { cpSync, rmSync } from 'node:fs';
import { basename } from 'node:path';

rmSync('public', { recursive: true, force: true });
cpSync('apps/web/dist', 'public', {
  recursive: true,
  filter: (src) => basename(src) !== 'index.html',
});
