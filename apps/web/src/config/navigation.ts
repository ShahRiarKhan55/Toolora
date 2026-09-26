import { CATEGORIES } from '@toolora/shared';
import type { CategoryId } from '@toolora/shared';

export interface NavItem {
  label: string;
  href: string;
}

// Until Phase 3 adds routing and tool pages, categories and the tool list are sections of the home
// page. Every link into them goes through these helpers, so Phase 3 changes them in one place.
export function categoryHref(id: CategoryId): string {
  return `/#${id}`;
}

export const ALL_TOOLS_HREF = '/#tools';

/** Categories that appear in the header and footer. AI has no tools yet, so it is left out. */
export const CATEGORY_NAV: readonly NavItem[] = CATEGORIES.filter(
  (category) => category.id !== 'ai',
).map((category) => ({ label: category.name, href: categoryHref(category.id) }));

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  ...CATEGORY_NAV,
  { label: 'All Tools', href: ALL_TOOLS_HREF },
];
