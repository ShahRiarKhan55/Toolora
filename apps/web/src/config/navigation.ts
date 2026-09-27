import { ALL_TOOLS_ROUTE, CATEGORIES, categoryRoute } from '@toolora/shared';

export interface NavItem {
  label: string;
  href: string;
}

export const ALL_TOOLS_HREF = ALL_TOOLS_ROUTE;

/** Categories that appear in the header and footer. AI has no tools yet, so it is left out. */
export const CATEGORY_NAV: readonly NavItem[] = CATEGORIES.filter(
  (category) => category.id !== 'ai',
).map((category) => ({ label: category.name, href: categoryRoute(category.id) }));

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  ...CATEGORY_NAV,
  { label: 'All Tools', href: ALL_TOOLS_HREF },
];
