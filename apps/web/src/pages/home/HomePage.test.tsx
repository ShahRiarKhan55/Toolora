import { getPopulatedCategories, getToolsByCategory, toolRoute } from '@toolora/shared';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn(actual.useNavigate) };
});

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('has one h1 with the hero message', () => {
    renderHome();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Simple tools for everyday tasks.' }),
    ).toBeInTheDocument();
  });

  it('shows one card per category that has tools, in order, as h3 headings', () => {
    renderHome();
    const categories = within(screen.getByRole('region', { name: 'Categories' }));
    const headings = categories.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(getPopulatedCategories().map((category) => `${category.name} Tools`));
  });

  it('gives every category card an id that navigation links can target', () => {
    renderHome();
    for (const category of getPopulatedCategories()) {
      expect(document.getElementById(category.id)).not.toBeNull();
    }
  });

  it("links each category card to that category's page", () => {
    renderHome();
    for (const category of getPopulatedCategories()) {
      expect(screen.getByRole('link', { name: `${category.name} Tools` })).toHaveAttribute(
        'href',
        `/tools/${category.id}`,
      );
    }
  });

  it('shows a tool count badge per category and does not link the empty AI category', () => {
    renderHome();
    for (const category of getPopulatedCategories()) {
      const count = getToolsByCategory(category.id).length;
      const card = within(screen.getByRole('article', { name: `${category.name} Tools` }));
      expect(card.getByText(`${count} ${count === 1 ? 'tool' : 'tools'}`)).toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: /AI Tools/ })).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/tools/ai"]')).toBeNull();
  });

  it('shows a working, enabled search box', () => {
    renderHome();
    const search = screen.getByRole('searchbox', { name: 'Search tools' });
    expect(search).not.toBeDisabled();
  });

  it('navigates to the All Tools page with the query on search submit', () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    renderHome();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tools' }), {
      target: { value: 'json' },
    });
    fireEvent.submit(screen.getByRole('search'));

    expect(navigate).toHaveBeenCalledWith('/tools?q=json');
  });

  it('features the first tools of every populated category, each linking to its own page', () => {
    renderHome();
    const tools = within(screen.getByRole('region', { name: 'Featured tools' }));
    for (const category of getPopulatedCategories()) {
      for (const tool of getToolsByCategory(category.id).slice(0, 3)) {
        expect(tools.getByRole('link', { name: tool.name })).toHaveAttribute(
          'href',
          toolRoute(tool.slug),
        );
      }
    }
  });

  it('links to the full tools directory', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /^Browse all \d+ tools$/ })).toHaveAttribute(
      'href',
      '/tools',
    );
  });

  it('offers a link to browse the categories', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute(
      'href',
      '/#categories',
    );
  });

  it('keeps a valid heading outline: h1, then h2 sections, then h3 cards', () => {
    renderHome();
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });
});
