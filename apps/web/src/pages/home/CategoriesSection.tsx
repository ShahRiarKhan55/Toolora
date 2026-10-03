import { categoryRoute, getPopulatedCategories, getToolsByCategory } from '@toolora/shared';
import { Link } from 'react-router-dom';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CATEGORY_PRESENTATION } from '../../config/categoryPresentation';
import { cx } from '../../lib/cx';

export function CategoriesSection() {
  return (
    <Section
      id="categories"
      title="Categories"
      description="Tools are grouped by who they help. Select a category to see its tools."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {getPopulatedCategories().map((category) => {
          const { Icon, tile } = CATEGORY_PRESENTATION[category.id];
          const toolCount = getToolsByCategory(category.id).length;
          return (
            <li key={category.id} id={category.id}>
              <Card
                as="article"
                aria-labelledby={`${category.id}-title`}
                className="relative flex h-full flex-col"
              >
                <div
                  className={cx('flex size-11 items-center justify-center rounded-control', tile)}
                >
                  <Icon className="size-6" />
                </div>
                <h3 id={`${category.id}-title`} className="mt-4 text-lg font-semibold">
                  <Link
                    to={categoryRoute(category.id)}
                    className="static after:absolute after:inset-0 hover:underline"
                  >
                    {category.name} Tools
                  </Link>
                </h3>
                <p className="mt-1 flex-1 text-muted-foreground">{category.description}</p>
                <div className="mt-4">
                  <Badge tone="primary">
                    {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
                  </Badge>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
