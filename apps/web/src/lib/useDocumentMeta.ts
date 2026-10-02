import type { StructuredData } from '@toolora/shared';
import { absoluteUrl } from '@toolora/shared';
import { useEffect } from 'react';
import { PUBLIC_SITE_ORIGIN } from './siteUrl';

export interface PageMeta {
  title: string;
  description: string;
  /** The path this page canonically represents, e.g. "/tools/gpa-calculator". Omit for a page that
   *  genuinely has no canonical URL of its own (currently only the 404 page) — omitting removes any
   *  canonical link and og:url left over from a previous page instead of pointing at a real one. */
  path?: string;
  /** Defaults to 'index,follow'. Use 'noindex,follow' for pages that should not be indexed (404s,
   *  and any other page that is not meant to represent real, findable content) — see CLAUDE.md. */
  robots?: 'index,follow' | 'noindex,follow';
  /** Defaults to 'website' — every current Toolora page is a tool, a listing or the home page, never
   *  an article. */
  ogType?: 'website';
  /** JSON-LD to embed for this page (see @toolora/shared's structuredData builders). Omit for a page
   *  with no genuine structured data to report. */
  structuredData?: StructuredData;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string | undefined): void {
  const existing = document.querySelector(`meta[${attr}="${key}"]`);
  if (content === undefined) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.head.appendChild(document.createElement('meta'));
  el.setAttribute(attr, key);
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string | undefined): void {
  const existing = document.querySelector(`link[rel="${rel}"]`);
  if (href === undefined) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.head.appendChild(document.createElement('link'));
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
}

const STRUCTURED_DATA_ID = 'page-structured-data';

function upsertStructuredData(data: StructuredData | undefined): void {
  const existing = document.getElementById(STRUCTURED_DATA_ID);
  if (data === undefined) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.head.appendChild(document.createElement('script'));
  el.id = STRUCTURED_DATA_ID;
  el.setAttribute('type', 'application/ld+json');
  // Guards against a "</script>" sequence inside a value (e.g. a future tool description) breaking
  // out of the tag if this markup were ever serialized back to an HTML string.
  el.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Sets every per-route SEO tag — title, description, canonical, robots, Open Graph and Twitter/X
 * card, plus optional JSON-LD — while a route is mounted. Every field is written unconditionally on
 * each call (falling back to this hook's own defaults, never "whatever the previous page left"), so
 * navigating between routes can never leave a stale value behind: this is a stopgap for crawlers that
 * do not run JavaScript until the server injects route-specific tags (Phase 8 in the original plan;
 * see docs/architecture.md, "SEO strategy").
 */
export function useDocumentMeta(meta: PageMeta): void {
  const {
    title,
    description,
    path,
    robots = 'index,follow',
    ogType = 'website',
    structuredData,
  } = meta;
  const canonical = path === undefined ? undefined : absoluteUrl(PUBLIC_SITE_ORIGIN, path);

  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertLink('canonical', canonical);

    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:url', canonical);

    upsertMeta('name', 'twitter:card', 'summary');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    upsertStructuredData(structuredData);
  }, [title, description, canonical, robots, ogType, structuredData]);
}
