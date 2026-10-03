import { ALL_TOOLS_ROUTE, categoryRoute, getPopulatedCategories } from '@toolora/shared';

export interface NavItem {
  label: string;
  href: string;
}

export const ALL_TOOLS_HREF = ALL_TOOLS_ROUTE;

/** Categories that appear in the header and footer: only those with tools (empty ones are noindex). */
export const CATEGORY_NAV: readonly NavItem[] = getPopulatedCategories().map((category) => ({
  label: category.name,
  href: categoryRoute(category.id),
}));

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  ...CATEGORY_NAV,
  { label: 'All Tools', href: ALL_TOOLS_HREF },
];
