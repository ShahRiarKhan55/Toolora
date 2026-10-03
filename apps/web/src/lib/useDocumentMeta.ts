import type { PageMeta, StructuredData } from '@toolora/shared';
import { absoluteUrl } from '@toolora/shared';
import { useEffect } from 'react';
import { PUBLIC_SITE_ORIGIN } from './siteUrl';

export type { PageMeta };

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
 * navigating between routes can never leave a stale value behind. In production the server has
 * already injected the same tags into the initial HTML (see apps/server/src/seoHead.ts); the upserts
 * below find and update those elements in place, so no duplicates accumulate.
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
