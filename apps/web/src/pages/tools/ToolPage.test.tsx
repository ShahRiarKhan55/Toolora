import { getToolBySlug, getToolVariantBySlug, TOOL_VARIANTS, toolRoute } from '@toolora/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { getRelatedTools } from '../../lib/relatedTools';
import { TOOLS } from '@toolora/shared';
import { ToolPage } from './ToolPage';

function renderTool(slug: string) {
  const tool = getToolBySlug(slug)!;
  return render(
    <MemoryRouter>
      <ToolPage tool={tool} />
    </MemoryRouter>,
  );
}

describe('ToolPage', () => {
  it('links to its own category in the breadcrumb', () => {
    renderTool('gpa-calculator');
    const nav = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
    expect(nav.getByRole('link', { name: 'Student Tools' })).toHaveAttribute(
      'href',
      '/tools/student',
    );
  });

  it('shows a related-tools section that excludes itself and links to real tool pages', () => {
    const tool = getToolBySlug('gpa-calculator')!;
    renderTool('gpa-calculator');

    const heading = screen.getByRole('heading', { name: 'Related tools' });
    const section = within(heading.closest('section')!);
    const expected = getRelatedTools(TOOLS, tool);

    expect(expected.length).toBeGreaterThan(0);
    for (const related of expected) {
      expect(section.getByRole('link', { name: related.name })).toHaveAttribute(
        'href',
        toolRoute(related.slug),
      );
    }
    expect(section.queryByRole('link', { name: tool.name })).not.toBeInTheDocument();
  });

  it.each(TOOLS)('sets its own title, description and canonical for $slug', (tool) => {
    renderTool(tool.slug);
    const meta = (attr: string, key: string) =>
      document.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content');

    expect(document.title).toBe(tool.seoTitle);
    expect(meta('name', 'description')).toBe(tool.seoDescription);
    expect(meta('name', 'robots')).toBe('index,follow');
    expect(meta('property', 'og:title')).toBe(tool.seoTitle);
    expect(meta('name', 'twitter:title')).toBe(tool.seoTitle);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      toolRoute(tool.slug),
    );
  });
});

describe('ToolPage variants', () => {
  function renderVariant(slug: string) {
    const variant = getToolVariantBySlug(slug)!;
    return render(
      <MemoryRouter>
        <ToolPage tool={getToolBySlug(variant.toolId)!} variant={variant} />
      </MemoryRouter>,
    );
  }

  it.each(TOOL_VARIANTS)('$slug: own h1, title, canonical and a link to the general tool', (v) => {
    renderVariant(v.slug);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: v.name })).toBeInTheDocument();
    expect(document.title).toBe(v.seoTitle);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      toolRoute(v.slug),
    );
    const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
    expect(crumbs.getByRole('link', { name: 'Currency Converter' })).toHaveAttribute(
      'href',
      '/tools/currency-converter',
    );
    const related = within(
      screen.getByRole('heading', { name: 'Related tools' }).closest('section')!,
    );
    expect(related.getAllByRole('link')[0]).toHaveAttribute('href', '/tools/currency-converter');
  });

  it('renders the converter preset for the pair', async () => {
    renderVariant('bdt-to-jpy');
    expect(await screen.findByLabelText('From')).toHaveValue('BDT');
    expect(screen.getByLabelText('To')).toHaveValue('JPY');
  });

  it('shows the variant explanation, not the general copy', () => {
    renderVariant('jpy-to-bdt');
    expect(screen.getByText(/illustrative rate/)).toBeInTheDocument();
  });
});
