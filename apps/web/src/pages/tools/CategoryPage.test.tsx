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

describe('CategoryPage introductions', () => {
  it.each(['japan', 'currency', 'text', 'finance', 'time'] as const)(
    'explains what the %s category is for, before its tools',
    (id) => {
      renderCategory(id);
      const paragraphs = document.querySelectorAll('div.space-y-3 > p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    },
  );

  it('keeps the Currency copy honest about daily reference rates', () => {
    renderCategory('currency');
    expect(screen.getByText(/published once a day, not live/)).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/daily reference exchange rates/);
    expect(document.body.textContent).not.toMatch(/real-time|live rate/i);
  });

  it('keeps the Japan copy independent of any government body', () => {
    renderCategory('japan');
    expect(screen.getByText(/not connected to any government body/)).toBeInTheDocument();
  });

  it('shows no intro for a category without one', () => {
    renderCategory('developer');
    expect(document.querySelector('div.space-y-3 > p')).toBeNull();
  });
});

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

  it('shows the Currency Converter and links its deliberate pair pages', () => {
    renderCategory('currency');
    expect(screen.getByRole('heading', { level: 1, name: 'Currency Tools' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Currency Converter/ })).toHaveAttribute(
      'href',
      '/tools/currency-converter',
    );
    const pairs = within(screen.getByRole('region', { name: 'Popular conversions' }));
    expect(pairs.getByRole('link', { name: 'JPY to BDT Converter' })).toHaveAttribute(
      'href',
      '/tools/jpy-to-bdt',
    );
    expect(pairs.getByRole('link', { name: 'BDT to JPY Converter' })).toHaveAttribute(
      'href',
      '/tools/bdt-to-jpy',
    );
  });

  it('does not list the converter or pair links on the Japan category', () => {
    renderCategory('japan');
    expect(screen.queryByRole('link', { name: /Currency Converter/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Popular conversions' })).not.toBeInTheDocument();
  });

  it.each([
    ['text', 'Text Tools', ['Text Case Converter', 'Markdown Preview']],
    ['finance', 'Finance Tools', ['Compound Interest Calculator', 'Loan Payment Calculator']],
    ['time', 'Time Tools', ['Time Zone Converter', 'Business Days Calculator']],
    ['developer', 'Developer Tools', ['URL Encoder / Decoder', 'HTML Entity Encoder / Decoder']],
  ] as const)('lists the %s tools and no empty-state', (id, heading, names) => {
    renderCategory(id);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    for (const name of names) {
      expect(
        screen.getByRole('link', { name: new RegExp(name.split('/')[0]!.trim()) }),
      ).toBeInTheDocument();
    }
    expect(screen.queryByText('No tools here yet')).not.toBeInTheDocument();
  });
});
