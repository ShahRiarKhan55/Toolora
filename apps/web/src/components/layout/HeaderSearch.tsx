import { CATEGORIES, TOOLS, toolRoute } from '@toolora/shared';
import { useMemo, useState } from 'react';
import type { FormEvent, Ref } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchTools } from '../../lib/searchTools';
import { Input } from '../ui/Input';
import { Container } from './Container';

const MAX_RESULTS = 6;
const categoryName = new Map(CATEGORIES.map((category) => [category.id, category.name]));

interface HeaderSearchPanelProps {
  id: string;
  open: boolean;
  inputRef: Ref<HTMLInputElement>;
  /** Called after the visitor picks a result or submits, so the header can close the panel. */
  onDone: () => void;
}

/**
 * The header's search box and live results, shown under the header bar when opened. It reuses the
 * same local `searchTools` filter as the All Tools page: matches link straight to the tool, and
 * Enter opens the full result list at /tools?q=…. Nothing is sent to a server.
 */
export function HeaderSearchPanel({ id, open, inputRef, onDone }: HeaderSearchPanelProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const needle = query.trim();
  const matches = useMemo(() => (needle === '' ? [] : searchTools(TOOLS, needle)), [needle]);

  function finish() {
    setQuery('');
    onDone();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (needle === '') return;
    void navigate(`/tools?q=${encodeURIComponent(needle)}`);
    finish();
  }

  return (
    <div id={id} hidden={!open} className="border-t border-border bg-surface">
      <Container className="py-3">
        <form role="search" onSubmit={handleSubmit} className="max-w-xl">
          <Input
            ref={inputRef}
            type="search"
            label="Find a tool"
            hideLabel
            placeholder="Search tools by name, category or keyword…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </form>
        {needle !== '' && (
          <div className="mt-3 max-w-xl">
            <p role="status" className="text-sm text-muted-foreground">
              {matches.length === 0
                ? `No tools match “${needle}”.`
                : `${matches.length} ${matches.length === 1 ? 'tool' : 'tools'} found.`}
            </p>
            {matches.length > 0 && (
              <ul className="mt-1">
                {matches.slice(0, MAX_RESULTS).map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={toolRoute(tool.slug)}
                      onClick={finish}
                      className="flex min-h-11 flex-wrap items-center gap-x-2 rounded-control px-3 py-1 hover:bg-surface-muted"
                    >
                      <span className="font-semibold">{tool.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {categoryName.get(tool.category)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {matches.length > MAX_RESULTS && (
              <Link
                to={`/tools?q=${encodeURIComponent(needle)}`}
                onClick={finish}
                className="mt-1 inline-flex min-h-11 items-center px-3 text-sm font-semibold text-primary underline"
              >
                See all {matches.length} results
              </Link>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
