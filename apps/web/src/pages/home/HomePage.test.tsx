import { CATEGORIES } from '@toolora/shared';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('has one h1 with the hero message', () => {
    render(<HomePage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Simple tools for everyday tasks.' }),
    ).toBeInTheDocument();
  });

  it('shows one card per category, in order, as h3 headings', () => {
    render(<HomePage />);
    const categories = within(screen.getByRole('region', { name: 'Categories' }));
    const headings = categories.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(CATEGORIES.map((category) => `${category.name} Tools`));
  });

  it('gives every category card an id that navigation links can target', () => {
    render(<HomePage />);
    for (const category of CATEGORIES) {
      expect(document.getElementById(category.id)).not.toBeNull();
    }
  });

  it('marks AI as coming later and the other categories as coming soon', () => {
    render(<HomePage />);
    const ai = within(screen.getByRole('article', { name: /AI Tools/ }));
    expect(ai.getByText('Coming later')).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon')).toHaveLength(3);
  });

  it('shows a search box that is disabled and says why', () => {
    render(<HomePage />);
    const search = screen.getByRole('searchbox', { name: 'Search tools' });
    expect(search).toBeDisabled();
    expect(search).toHaveAccessibleDescription(/available once the first tools are added/i);
  });

  it('explains that there are no tools yet instead of listing any', () => {
    render(<HomePage />);
    const tools = within(screen.getByRole('region', { name: 'All tools' }));
    expect(tools.getByRole('heading', { name: 'The first tools are on their way' })).toBeVisible();
    expect(tools.queryByRole('link')).not.toBeInTheDocument();
  });

  it('offers a link to browse the categories', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute(
      'href',
      '#categories',
    );
  });

  it('keeps a valid heading outline: h1, then h2 sections, then h3 cards', () => {
    render(<HomePage />);
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });
});
