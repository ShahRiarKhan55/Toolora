import { allToolsMeta, CATEGORIES, categoryListText, isCategoryId, TOOLS } from '@toolora/shared';
import type { CategoryId } from '@toolora/shared';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/layout/PageHeader';
import { ToolCard } from '../../components/tool/ToolCard';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { SearchIcon } from '../../components/ui/icons';
import { searchTools } from '../../lib/searchTools';
import { useDocumentMeta } from '../../lib/useDocumentMeta';

export function AllToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const categoryParam = searchParams.get('category');
  const activeCategory = isCategoryId(categoryParam) ? categoryParam : null;

  // Search/filter query params never create a separate canonical page — see allToolsCanonicalPath.
  useDocumentMeta(allToolsMeta(activeCategory, query));

  const results = useMemo(() => {
    const matches = searchTools(TOOLS, query);
    return activeCategory ? matches.filter((tool) => tool.category === activeCategory) : matches;
  }, [query, activeCategory]);

  function handleQueryChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === '') {
      next.delete('q');
    } else {
      next.set('q', value);
    }
    setSearchParams(next, { replace: true });
  }

  function handleCategoryChange(categoryId: CategoryId | null) {
    const next = new URLSearchParams(searchParams);
    if (categoryId) {
      next.set('category', categoryId);
    } else {
      next.delete('category');
    }
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'All Tools' }]} />
      <PageHeader
        title="All Tools"
        description={`${TOOLS.length} tools across ${categoryListText()} categories, all free and running in your browser.`}
        className="mt-4"
      />

      <div role="search" className="mt-8 max-w-md">
        <Input
          type="search"
          label="Search tools"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Search by name, category or keyword…"
        />
      </div>

      <div role="group" aria-label="Filter by category" className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeCategory === null ? 'primary' : 'secondary'}
          aria-pressed={activeCategory === null}
          onClick={() => handleCategoryChange(null)}
        >
          All categories
        </Button>
        {CATEGORIES.map((category) => (
          <Button
            key={category.id}
            size="sm"
            variant={activeCategory === category.id ? 'primary' : 'secondary'}
            aria-pressed={activeCategory === category.id}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="mt-8">
        {results.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {results.length} {results.length === 1 ? 'tool' : 'tools'}
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((tool) => (
                <li key={tool.id}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState
            as="h2"
            icon={<SearchIcon className="size-6" />}
            title="No tools match your search"
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear search and filters
              </Button>
            }
          >
            Try a different word, or clear the search and category filter to see every tool.
          </EmptyState>
        )}
      </div>
    </Container>
  );
}
