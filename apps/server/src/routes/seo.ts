import { buildRobotsTxt, buildSitemapXml } from '@toolora/shared';
import { Router } from 'express';

/**
 * Serves `robots.txt` and `sitemap.xml` from the existing Express server (see `docs/architecture.md`,
 * "SEO strategy") rather than a separate static-hosting setup. Both are generated on each request
 * from the tool registry, not written to disk, so they can never go stale relative to it.
 */
export function seoRouter({ publicSiteOrigin }: { publicSiteOrigin: string | undefined }): Router {
  const router = Router();

  router.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(buildRobotsTxt(publicSiteOrigin));
  });

  router.get('/sitemap.xml', (_req, res) => {
    // The sitemap protocol requires absolute URLs. Without a configured production origin there is
    // no real domain to build them from, so nothing is served rather than publishing relative or
    // invented URLs — see CLAUDE.md, "Rules against fake functionality".
    if (publicSiteOrigin === undefined) {
      res
        .status(404)
        .type('text/plain')
        .send('sitemap.xml is not available until VITE_PUBLIC_SITE_URL is configured.');
      return;
    }
    res.type('application/xml').send(buildSitemapXml(publicSiteOrigin));
  });

  return router;
}
