import { CATEGORIES, toolRoute } from '@toolora/shared';
import type { ToolMeta } from '@toolora/shared';
import { Link } from 'react-router-dom';
import { CATEGORY_PRESENTATION } from '../../config/categoryPresentation';
import { TOOL_ICON } from '../../config/toolPresentation';
import { cx } from '../../lib/cx';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

interface ToolCardProps {
  tool: ToolMeta;
  /** Hide on a page that already groups by category (e.g. a single category's tool list). */
  showCategory?: boolean;
}

/**
 * A tool summary card, used on the home page, "All tools" and category pages. The whole card is
 * clickable via a "stretched link" (the visible link is the heading; `after:absolute after:inset-0`
 * extends its hit area over the full card), which keeps a single accessible link per card while
 * giving it a touch target far larger than the 44px minimum.
 */
export function ToolCard({ tool, showCategory = true }: ToolCardProps) {
  const Icon = TOOL_ICON[tool.icon];
  const { tile } = CATEGORY_PRESENTATION[tool.category];
  const category = categoryById.get(tool.category);

  return (
    <Card
      as="article"
      aria-labelledby={`${tool.id}-title`}
      className="relative flex h-full flex-col"
    >
      <div className={cx('flex size-11 items-center justify-center rounded-control', tile)}>
        <Icon className="size-6" />
      </div>
      <h3 id={`${tool.id}-title`} className="mt-4 text-lg font-semibold">
        <Link
          to={toolRoute(tool.slug)}
          className="static after:absolute after:inset-0 hover:underline"
        >
          {tool.name}
        </Link>
      </h3>
      <p className="mt-1 flex-1 text-muted-foreground">{tool.description}</p>
      {showCategory && category && (
        <div className="mt-4">
          <Badge tone="neutral">{category.name}</Badge>
        </div>
      )}
    </Card>
  );
}
