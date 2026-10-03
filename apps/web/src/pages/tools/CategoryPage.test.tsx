import type { CategoryId } from '@toolora/shared';
import {
  categoryRoute,
  getPopulatedCategories,
  getToolsByCategory,
  toolRoute,
} from '@toolora/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CategoryPage } from './CategoryPage';

function renderCategory(categoryId: CategoryId) {
  return render(
    <MemoryRouter>
      <CategoryPage categoryId={categoryId} />
    </MemoryRouter>,
  );
}

describe('CategoryPage', () => {
  it('shows a visible tool count for a category with tools', () => {
    renderCategory('developer');
    const count = getToolsByCategory('developer').length;
    expect(screen.getByText(`${count} tools in this category.`)).toBeInTheDocument();
  });

  it('links every tool card to its own tool page', () => {
    renderCategory('student');
    for (const tool of getToolsByCategory('student')) {
      expect(screen.getByRole('link', { name: tool.name })).toHaveAttribute(
        'href',
        toolRoute(tool.slug),
      );
    }
  });

  it('shows a polished empty state with a way out for the AI category', () => {
    renderCategory('ai');
    expect(screen.getByText('No tools in this category yet.')).toBeInTheDocument();
    expect(screen.getByText('No tools here yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse all tools' })).toHaveAttribute(
      'href',
      '/tools',
    );
  });

  it('keeps a valid heading outline on a populated category (h1, h2, then h3 cards)', () => {
    renderCategory('japan');
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  it('keeps a valid heading outline with no skipped levels, even on the empty AI category', () => {
    renderCategory('ai');
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  it('never links to the empty AI category from a populated one', () => {
    renderCategory('japan');
    expect(screen.queryByRole('link', { name: /AI Tools/ })).not.toBeInTheDocument();
  });

  it('links to every other category, never to itself', () => {
    renderCategory('japan');
    const nav = within(screen.getByRole('navigation', { name: 'Other categories' }));
    for (const category of getPopulatedCategories().filter((c) => c.id !== 'japan')) {
      expect(category.id).not.toBe('ai');
      expect(nav.getByRole('link', { name: `${category.name} Tools` })).toHaveAttribute(
        'href',
        categoryRoute(category.id),
      );
    }
    expect(nav.queryByRole('link', { name: 'Japan Tools' })).not.toBeInTheDocument();
  });
});
