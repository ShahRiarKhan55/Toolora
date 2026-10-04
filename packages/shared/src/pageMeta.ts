// Per-route SEO metadata (Phase 8), derived from the registry and site constants. The web app's
// pages (client-side `useDocumentMeta`) and the server (head injection into index.html) both call
// these, so there is one definition of "what the tags for this route are" and no second table.

import type { CategoryId } from './categories';
import { CATEGORIES, CATEGORY_IDS } from './categories';
import { ACCOUNT_ROUTE, CONTACT_ROUTE, HOME_ROUTE, PRIVACY_ROUTE, SITE_NAME } from './site';
import type { StructuredData } from './structuredData';
import { buildToolStructuredData, buildWebSiteStructuredData } from './structuredData';
import type { ToolMeta } from './tools';
import {
  ALL_TOOLS_ROUTE,
  categoryRoute,
  getToolBySlug,
  getToolsByCategory,
  toolRoute,
} from './tools';

export interface PageMeta {
  title: string;
  description: string;
  /** The path this page canonically represents, e.g. "/tools/gpa-calculator". Omit for a page that
   *  genuinely has no canonical URL of its own (the 404 page) — omitting removes any canonical link
   *  and og:url left over from a previous page instead of pointing at a real one. */
  path?: string;
  /** Defaults to 'index,follow'. Use 'noindex,follow' for pages that should not be indexed. */
  robots?: 'index,follow' | 'noindex,follow';
  /** Defaults to 'website' — every current Toolora page is a tool, a listing or the home page. */
  ogType?: 'website';
  /** JSON-LD for this page. Omit for a page with no genuine structured data to report. */
  structuredData?: StructuredData;
}

/**
 * The canonical path for the All Tools page given its current `?q=`/`?category=` state. Search and
 * filter query parameters never create a separate canonical page: a plain `q` search canonicalizes
 * to `/tools` itself, and an exact `category` match with no search term canonicalizes to that
 * category's own page, since the two URLs render identical listings.
 */
export function allToolsCanonicalPath(activeCategory: CategoryId | null, query: string): string {
  if (activeCategory !== null && query === '') return categoryRoute(activeCategory);
  return ALL_TOOLS_ROUTE;
}

export function isCategoryId(value: string | null): value is CategoryId {
  return value !== null && (CATEGORY_IDS as readonly string[]).includes(value);
}

/** "Japan, Student and Developer" — derived from the registry, never a hardcoded string. */
export function categoryListText(): string {
  const names = CATEGORIES.filter((category) => getToolsByCategory(category.id).length > 0).map(
    (category) => category.name,
  );
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function homeMeta(origin: string | undefined): PageMeta {
  return {
    title: `${SITE_NAME} – Simple online tools for everyday tasks`,
    description:
      'Toolora is a collection of simple online tools for Japan-related tasks, students and developers. Tools are built to run in your browser.',
    path: HOME_ROUTE,
    structuredData: buildWebSiteStructuredData(origin),
  };
}

export function allToolsMeta(activeCategory: CategoryId | null, query: string): PageMeta {
  return {
    title: `All Tools — ${SITE_NAME}`,
    description: `Browse every Toolora tool: ${categoryListText()} utilities that run entirely in your browser.`,
    path: allToolsCanonicalPath(activeCategory, query),
  };
}

export function categoryMeta(categoryId: CategoryId): PageMeta {
  const category = CATEGORIES.find((c) => c.id === categoryId)!;
  const count = getToolsByCategory(categoryId).length;
  return {
    title: `${category.name} Tools — ${SITE_NAME}`,
    description: `${category.description} ${count > 0 ? `${count} tools available.` : ''}`.trim(),
    path: categoryRoute(categoryId),
    // A category with no tools yet (currently "ai") has no indexable content of its own.
    robots: count > 0 ? 'index,follow' : 'noindex,follow',
  };
}

export function toolPageMeta(tool: ToolMeta, origin: string | undefined): PageMeta {
  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    path: toolRoute(tool.slug),
    structuredData: buildToolStructuredData(origin, tool),
  };
}

// No `path`: a 404 has no canonical URL of its own, and must not point at a real page.
export const NOT_FOUND_META: PageMeta = {
  title: `Page not found — ${SITE_NAME}`,
  description: 'This page does not exist.',
  robots: 'noindex,follow',
};

// A private page: noindex, and no `path` so it claims no canonical URL or og:url (like the 404 page).
// Indexable pages never depend on it, so a sign-in form stays out of search results.
export const ACCOUNT_META: PageMeta = {
  title: `Account — ${SITE_NAME}`,
  description: `${SITE_NAME} accounts are not open to the public yet. No account is needed to use the tools.`,
  robots: 'noindex,follow',
};

export const PRIVACY_META: PageMeta = {
  title: `Privacy — ${SITE_NAME}`,
  description: `What ${SITE_NAME} does and does not do with your data: tool input stays in your browser, and the server keeps only basic request logs.`,
  path: PRIVACY_ROUTE,
};

export const CONTACT_META: PageMeta = {
  title: `Contact — ${SITE_NAME}`,
  description: `How to contact the person who runs ${SITE_NAME}, including for privacy questions.`,
  path: CONTACT_ROUTE,
};

/**
 * Resolves a request pathname (+ query string) to its metadata, mirroring the web router
 * (`/`, `/account`, `/privacy`, `/contact`, `/tools`, `/tools/<category|slug>`, everything else 404). `status` is the HTTP status the
 * server should answer with.
 */
export function resolveRouteMeta(
  pathname: string,
  search: string,
  origin: string | undefined,
): { meta: PageMeta; status: 200 | 404 } {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (path === HOME_ROUTE) return { meta: homeMeta(origin), status: 200 };
  if (path === ACCOUNT_ROUTE) return { meta: ACCOUNT_META, status: 200 };
  if (path === PRIVACY_ROUTE) return { meta: PRIVACY_META, status: 200 };
  if (path === CONTACT_ROUTE) return { meta: CONTACT_META, status: 200 };

  if (path === ALL_TOOLS_ROUTE) {
    const params = new URLSearchParams(search);
    const category = params.get('category');
    return {
      meta: allToolsMeta(isCategoryId(category) ? category : null, params.get('q') ?? ''),
      status: 200,
    };
  }

  const match = /^\/tools\/([^/]+)$/.exec(path);
  if (match) {
    let param: string;
    try {
      param = decodeURIComponent(match[1]!);
    } catch {
      return { meta: NOT_FOUND_META, status: 404 };
    }
    if (isCategoryId(param)) return { meta: categoryMeta(param), status: 200 };
    const tool = getToolBySlug(param);
    if (tool) return { meta: toolPageMeta(tool, origin), status: 200 };
  }

  return { meta: NOT_FOUND_META, status: 404 };
}
