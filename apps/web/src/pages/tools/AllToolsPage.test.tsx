import { getPopulatedCategories, getToolsByCategory, TOOLS } from '@toolora/shared';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AllToolsPage } from './AllToolsPage';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AllToolsPage />
    </MemoryRouter>,
  );
}

describe('AllToolsPage', () => {
  it('keeps a valid heading outline with no skipped levels', () => {
    renderAt('/tools');
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  it('offers category filters only for categories that have tools', () => {
    renderAt('/tools');
    const group = within(screen.getByRole('group', { name: 'Filter by category' }));
    expect(group.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'All categories',
      ...getPopulatedCategories().map((c) => c.name),
    ]);
    expect(group.queryByRole('button', { name: 'AI' })).not.toBeInTheDocument();
  });

  it('lists every tool when there is no search or filter', () => {
    renderAt('/tools');
    expect(screen.getByText(`${TOOLS.length} tools`)).toBeInTheDocument();
  });

  it('reads the initial search query from the URL', () => {
    renderAt('/tools?q=json');
    expect(screen.getByRole('searchbox', { name: 'Search tools' })).toHaveValue('json');
    expect(screen.getByRole('link', { name: 'JSON Formatter / Validator' })).toBeInTheDocument();
  });

  it('filters by name, keyword and category as the user types', () => {
    renderAt('/tools');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tools' }), {
      target: { value: 'epoch' },
    });
    expect(screen.getByRole('link', { name: 'Unix Timestamp Converter' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'GPA Calculator' })).not.toBeInTheDocument();
  });

  it('shows an empty state with no results, and a control to clear it', () => {
    renderAt('/tools');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tools' }), {
      target: { value: 'nonexistent-tool-xyz' },
    });
    expect(screen.getByText('No tools match your search')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));
    expect(screen.getByText(`${TOOLS.length} tools`)).toBeInTheDocument();
  });

  it('offers a category filter for every category, with "All categories" active by default', () => {
    renderAt('/tools');
    const group = screen.getByRole('group', { name: 'Filter by category' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All categories' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Developer' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('filters to one category when its chip is selected, and reflects it in the URL', () => {
    renderAt('/tools');
    fireEvent.click(screen.getByRole('button', { name: 'Student' }));

    const studentTools = getToolsByCategory('student');
    for (const tool of studentTools) {
      expect(screen.getByRole('link', { name: tool.name })).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('link', { name: 'JSON Formatter / Validator' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Student' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reads the initial category filter from the URL', () => {
    renderAt('/tools?category=developer');
    expect(screen.getByRole('button', { name: 'Developer' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('link', { name: 'GPA Calculator' })).not.toBeInTheDocument();
  });

  it('combines a search query with a category filter', () => {
    renderAt('/tools?category=japan&q=age');
    expect(screen.getByRole('link', { name: 'Japanese Age Calculator' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Word Counter' })).not.toBeInTheDocument();
  });

  it('ignores an unknown category value in the URL', () => {
    renderAt('/tools?category=not-a-real-category');
    expect(screen.getByText(`${TOOLS.length} tools`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All categories' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('returns to "All categories" when it is selected again', () => {
    renderAt('/tools?category=developer');
    fireEvent.click(screen.getByRole('button', { name: 'All categories' }));
    expect(screen.getByText(`${TOOLS.length} tools`)).toBeInTheDocument();
  });

  it('keeps a valid heading outline with no skipped levels on the empty-search state', () => {
    renderAt('/tools');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tools' }), {
      target: { value: 'nonexistent-tool-xyz' },
    });
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });
});
