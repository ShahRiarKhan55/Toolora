import { SITE_NAME, TOOLS } from '@toolora/shared';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/layout/PageHeader';
import { ToolCard } from '../../components/tool/ToolCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { SearchIcon } from '../../components/ui/icons';
import { searchTools } from '../../lib/searchTools';
import { useDocumentMeta } from '../../lib/useDocumentMeta';

export function AllToolsPage() {
  useDocumentMeta(
    `All Tools — ${SITE_NAME}`,
    'Browse every Toolora tool: Japan, Student and Developer utilities that run entirely in your browser.',
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const results = useMemo(() => searchTools(TOOLS, query), [query]);

  function handleQueryChange(value: string) {
    setSearchParams(value === '' ? {} : { q: value }, { replace: true });
  }

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'All Tools' }]} />
      <PageHeader
        title="All Tools"
        description={`${TOOLS.length} tools across Japan, Student and Developer categories, all free and running in your browser.`}
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
          <EmptyState icon={<SearchIcon className="size-6" />} title="No tools match your search">
            Try a different word, or clear the search to see every tool.
          </EmptyState>
        )}
      </div>
    </Container>
  );
}
