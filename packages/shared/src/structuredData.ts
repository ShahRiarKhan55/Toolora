// JSON-LD structured data (Phase 5). Every field is drawn from real, already-published data — the
// tool registry and site constants — never invented (see CLAUDE.md, "Rules against fake
// functionality"): no rating, review, price or download count, because Toolora has none of those.
// Both builders return `undefined` without a configured public origin: JSON-LD `url` fields must be
// absolute, and Toolora has no confirmed production domain yet, so nothing is emitted rather than
// publishing a relative or placeholder URL.

import { HOME_ROUTE, SITE_NAME, SITE_TAGLINE } from './site';
import type { ToolMeta } from './tools';
import { toolRoute } from './tools';
import { absoluteUrl } from './url';

export type StructuredData = Record<string, unknown>;

/** `WebSite` structured data for the home page. */
export function buildWebSiteStructuredData(origin: string | undefined): StructuredData | undefined {
  if (origin === undefined) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_TAGLINE,
    url: absoluteUrl(origin, HOME_ROUTE),
  };
}

/**
 * `WebApplication` structured data for a single tool page. `applicationCategory` uses schema.org's
 * own suggested "UtilitiesApplication" value, and `operatingSystem` reflects that every tool runs
 * in-browser with nothing to install — both genuinely true of every registry entry, not aspirational.
 */
export function buildToolStructuredData(
  origin: string | undefined,
  tool: ToolMeta,
): StructuredData | undefined {
  if (origin === undefined) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description: tool.seoDescription,
    url: absoluteUrl(origin, toolRoute(tool.slug)),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
  };
}
