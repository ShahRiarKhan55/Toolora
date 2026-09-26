import { CATEGORIES } from '@toolora/shared';
import type { CategoryId } from '@toolora/shared';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { CATEGORY_PRESENTATION } from '../../config/categoryPresentation';
import { cx } from '../../lib/cx';

// Every category is empty for now; AI is not even started, and should not read as imminent.
const LATER: ReadonlySet<CategoryId> = new Set(['ai']);

export function CategoriesSection() {
  return (
    <Section
      id="categories"
      title="Categories"
      description="Tools are grouped by who they help. Each category is listed below, and none has tools yet."
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORIES.map((category) => {
          const { Icon, tile } = CATEGORY_PRESENTATION[category.id];
          const later = LATER.has(category.id);
          return (
            <li key={category.id} id={category.id}>
              <Card
                as="article"
                aria-labelledby={`${category.id}-title`}
                className="flex h-full flex-col"
              >
                <div
                  className={cx('flex size-11 items-center justify-center rounded-control', tile)}
                >
                  <Icon className="size-6" />
                </div>
                <h3 id={`${category.id}-title`} className="mt-4 text-lg font-semibold">
                  {category.name} Tools
                </h3>
                <p className="mt-1 flex-1 text-muted-foreground">{category.description}</p>
                <div className="mt-4">
                  <Badge tone={later ? 'neutral' : 'primary'}>
                    {later ? 'Coming later' : 'Coming soon'}
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
