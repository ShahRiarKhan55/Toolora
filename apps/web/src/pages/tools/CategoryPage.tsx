import {
  ALL_TOOLS_ROUTE,
  CATEGORIES,
  categoryMeta,
  categoryRoute,
  getPopulatedCategories,
  getToolsByCategory,
  toolRoute,
  TOOL_VARIANTS,
} from '@toolora/shared';
import type { CategoryId } from '@toolora/shared';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/layout/PageHeader';
import { ToolCard } from '../../components/tool/ToolCard';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchIcon } from '../../components/ui/icons';
import { CATEGORY_INTRO } from '../../config/categoryIntro';
import { useDocumentMeta } from '../../lib/useDocumentMeta';

const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

export function CategoryPage({ categoryId }: { categoryId: CategoryId }) {
  const category = categoryById.get(categoryId)!;
  const intro = CATEGORY_INTRO[categoryId];
  const tools = getToolsByCategory(categoryId);
  // Deliberate pair pages (TOOL_VARIANTS) of this category's tools; they have no card of their own.
  const toolIds = new Set(tools.map((tool) => tool.id));
  const variants = TOOL_VARIANTS.filter((variant) => toolIds.has(variant.toolId));
  const otherCategories = getPopulatedCategories().filter((c) => c.id !== categoryId);

  useDocumentMeta(categoryMeta(categoryId));

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: `${category.name} Tools` }]} />
      <PageHeader
        title={`${category.name} Tools`}
        description={category.description}
        className="mt-4"
      >
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {tools.length > 0
            ? `${tools.length} ${tools.length === 1 ? 'tool' : 'tools'} in this category.`
            : 'No tools in this category yet.'}
        </p>
      </PageHeader>

      {intro && (
        <div className="mt-6 max-w-content space-y-3 text-muted-foreground">
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}

      <div className="mt-8">
        {tools.length > 0 ? (
          <>
            <h2 className="sr-only">{category.name} tools</h2>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool.id}>
                  <ToolCard tool={tool} showCategory={false} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            as="h2"
            icon={<SearchIcon className="size-6" />}
            title="No tools here yet"
            action={<ButtonLink href={ALL_TOOLS_ROUTE}>Browse all tools</ButtonLink>}
          >
            {category.name} tools are coming soon — check back later, or browse what is available in
            other categories today.
          </EmptyState>
        )}
      </div>

      {variants.length > 0 && (
        <section aria-labelledby="popular-conversions" className="mt-12">
          <h2 id="popular-conversions" className="text-lg font-semibold">
            Popular conversions
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {variants.map((variant) => (
              <li key={variant.slug}>
                <Link
                  to={toolRoute(variant.slug)}
                  className="inline-flex min-h-11 items-center rounded-control border border-border-strong px-4 text-sm font-semibold hover:bg-surface-muted"
                >
                  {variant.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Other categories" className="mt-12 border-t border-border pt-8">
        <h2 className="text-sm font-semibold text-muted-foreground">Browse other categories</h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          {otherCategories.map((other) => (
            <li key={other.id}>
              <Link
                to={categoryRoute(other.id)}
                className="inline-flex min-h-11 items-center rounded-control border border-border-strong px-4 text-sm font-semibold hover:bg-surface-muted"
              >
                {other.name} Tools
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
