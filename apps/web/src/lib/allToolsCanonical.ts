import { ALL_TOOLS_ROUTE, categoryRoute } from '@toolora/shared';
import type { CategoryId } from '@toolora/shared';

/**
 * The canonical path for the All Tools page given its current `?q=`/`?category=` state. Search and
 * filter query parameters must never create a separate canonical page (see docs/architecture.md,
 * "SEO strategy"): a plain `q` search canonicalizes to `/tools` itself, and an exact `category` match
 * with no search term canonicalizes to that category's own dedicated page (`/tools/<category>`),
 * since the two URLs render identical tool listings.
 */
export function allToolsCanonicalPath(activeCategory: CategoryId | null, query: string): string {
  if (activeCategory !== null && query === '') return categoryRoute(activeCategory);
  return ALL_TOOLS_ROUTE;
}
