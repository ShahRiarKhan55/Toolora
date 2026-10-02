import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('is noindex and has no canonical or og:url pointing at a real page', () => {
    // Leftovers from a previously rendered page must be cleared, not inherited.
    document.head.insertAdjacentHTML(
      'beforeend',
      '<link rel="canonical" href="/tools/json-formatter"><meta property="og:url" content="/tools/json-formatter">',
    );
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(document.title).toBe('Page not found — Toolora');
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex,follow',
    );
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
  });
});
