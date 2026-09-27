import { CATEGORIES, getToolsByCategory } from '@toolora/shared';
import type { CategoryId } from '@toolora/shared';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/layout/PageHeader';
import { ToolCard } from '../../components/tool/ToolCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchIcon } from '../../components/ui/icons';
import { useDocumentMeta } from '../../lib/useDocumentMeta';

const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

export function CategoryPage({ categoryId }: { categoryId: CategoryId }) {
  const category = categoryById.get(categoryId)!;
  const tools = getToolsByCategory(categoryId);

  useDocumentMeta(
    `${category.name} Tools — Toolora`,
    `${category.description} ${tools.length > 0 ? `${tools.length} tools available.` : ''}`.trim(),
  );

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: `${category.name} Tools` }]} />
      <PageHeader
        title={`${category.name} Tools`}
        description={category.description}
        className="mt-4"
      />

      <div className="mt-8">
        {tools.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} showCategory={false} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<SearchIcon className="size-6" />} title="No tools here yet">
            {category.name} tools are coming soon — check back later.
          </EmptyState>
        )}
      </div>
    </Container>
  );
}
