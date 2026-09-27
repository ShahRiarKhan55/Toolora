import { CATEGORY_IDS, getToolBySlug } from '@toolora/shared';
import type { CategoryId } from '@toolora/shared';
import { useParams } from 'react-router-dom';
import { NotFoundPage } from '../NotFoundPage';
import { CategoryPage } from './CategoryPage';
import { ToolPage } from './ToolPage';

function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

/**
 * Both category pages (`/tools/japan`) and tool pages (`/tools/<slug>`) are one path segment under
 * `/tools`, so a single dynamic route resolves which one a param refers to — generated from the
 * registry and category list, never a hand-written list of routes per category or tool.
 */
export function ToolsSlugRoute() {
  const { param } = useParams<{ param: string }>();
  if (!param) return <NotFoundPage />;

  if (isCategoryId(param)) return <CategoryPage categoryId={param} />;

  const tool = getToolBySlug(param);
  if (tool) return <ToolPage tool={tool} />;

  return <NotFoundPage />;
}
