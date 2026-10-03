import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveRouteMeta } from '@toolora/shared';
import express, { Router } from 'express';
import { hasSeoRegion, injectSeoHead, renderSeoHead } from '../seoHead';

/**
 * Serves the built web app: static assets, plus index.html for every other page route with that
 * route's SEO tags injected (so crawlers and link previews see them without running JavaScript).
 * Unknown page routes get the same shell with 404 status and noindex tags; the React router then
 * renders its own not-found page.
 */
export function spaRouter({
  webDistDir,
  publicSiteOrigin,
}: {
  webDistDir: string;
  publicSiteOrigin: string | undefined;
}): Router {
  const template = readFileSync(join(webDistDir, 'index.html'), 'utf8');
  if (!hasSeoRegion(template)) {
    throw new Error('web index.html is missing the <!--seo:start-->/<!--seo:end--> markers');
  }

  const router = Router();
  router.use(express.static(webDistDir, { index: false }));

  router.get(/.*/, (req, res, next) => {
    // /api keeps its JSON 404, and a missing file (/assets/x.js) must not come back as an HTML page.
    if (req.path === '/api' || req.path.startsWith('/api/') || /\.[a-z0-9]+$/i.test(req.path)) {
      next();
      return;
    }
    const search = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    const { meta, status } = resolveRouteMeta(req.path, search, publicSiteOrigin);
    res
      .status(status)
      .type('html')
      .send(injectSeoHead(template, renderSeoHead(meta, publicSiteOrigin)));
  });

  return router;
}
