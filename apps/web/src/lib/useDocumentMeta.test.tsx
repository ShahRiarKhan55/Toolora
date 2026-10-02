import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PageMeta } from './useDocumentMeta';
import { useDocumentMeta } from './useDocumentMeta';

function Page(meta: PageMeta) {
  useDocumentMeta(meta);
  return null;
}

function metaContent(attr: 'name' | 'property', key: string): string | null {
  return document.querySelector(`meta[${attr}="${key}"]`)?.getAttribute('content') ?? null;
}

function canonicalHref(): string | null {
  return document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;
}

function structuredDataJson(): unknown {
  const el = document.getElementById('page-structured-data');
  return el ? JSON.parse(el.textContent ?? 'null') : null;
}

describe('useDocumentMeta', () => {
  it('sets the title, description, robots and Open Graph/Twitter tags', () => {
    render(<Page title="A Tool — Toolora" description="Does a thing." path="/tools/a-tool" />);

    expect(document.title).toBe('A Tool — Toolora');
    expect(metaContent('name', 'description')).toBe('Does a thing.');
    expect(metaContent('name', 'robots')).toBe('index,follow');
    expect(metaContent('property', 'og:title')).toBe('A Tool — Toolora');
    expect(metaContent('property', 'og:description')).toBe('Does a thing.');
    expect(metaContent('property', 'og:type')).toBe('website');
    expect(metaContent('name', 'twitter:card')).toBe('summary');
    expect(metaContent('name', 'twitter:title')).toBe('A Tool — Toolora');
    expect(metaContent('name', 'twitter:description')).toBe('Does a thing.');
  });

  it('builds a same-origin-relative canonical and og:url when no public origin is configured', () => {
    render(<Page title="A Tool" description="Does a thing." path="/tools/a-tool" />);

    expect(canonicalHref()).toBe('/tools/a-tool');
    expect(metaContent('property', 'og:url')).toBe('/tools/a-tool');
  });

  it('omits the canonical link and og:url for a page with no path', () => {
    render(<Page title="Not found" description="Missing." robots="noindex,follow" />);

    expect(canonicalHref()).toBeNull();
    expect(metaContent('property', 'og:url')).toBeNull();
  });

  it('marks a page noindex when asked, and defaults to index,follow otherwise', () => {
    render(<Page title="Not found" description="Missing." robots="noindex,follow" />);
    expect(metaContent('name', 'robots')).toBe('noindex,follow');
  });

  it('embeds structured data as valid JSON-LD, and omits the tag when there is none', () => {
    const { rerender } = render(
      <Page
        title="Home"
        description="Tools."
        path="/"
        structuredData={{ '@type': 'WebSite', name: 'Toolora' }}
      />,
    );
    expect(structuredDataJson()).toEqual({ '@type': 'WebSite', name: 'Toolora' });

    rerender(<Page title="Home" description="Tools." path="/" />);
    expect(structuredDataJson()).toBeNull();
  });

  it('upserts existing tags instead of duplicating them across re-renders', () => {
    const { rerender } = render(<Page title="First" description="First page." path="/first" />);
    rerender(<Page title="Second" description="Second page." path="/second" />);

    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(metaContent('name', 'description')).toBe('Second page.');
    expect(canonicalHref()).toBe('/second');
  });

  it('leaves no stale metadata when navigating from one page to another (mount/unmount)', () => {
    const first = render(
      <Page
        title="Tool A"
        description="Tool A description."
        path="/tools/tool-a"
        structuredData={{ '@type': 'WebApplication', name: 'Tool A' }}
      />,
    );
    expect(canonicalHref()).toBe('/tools/tool-a');
    expect(structuredDataJson()).toEqual({ '@type': 'WebApplication', name: 'Tool A' });
    first.unmount();

    render(<Page title="Not found — Toolora" description="Missing." robots="noindex,follow" />);

    expect(document.title).toBe('Not found — Toolora');
    expect(metaContent('name', 'description')).toBe('Missing.');
    expect(metaContent('name', 'robots')).toBe('noindex,follow');
    // No canonical/og:url carried over from Tool A, and no leftover structured data.
    expect(canonicalHref()).toBeNull();
    expect(metaContent('property', 'og:url')).toBeNull();
    expect(structuredDataJson()).toBeNull();
  });
});
