import { SITE_NAME } from '@toolora/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routing', () => {
  it('renders the home page at /', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Simple tools for everyday tasks.' }),
    ).toBeInTheDocument();
  });

  it('renders the account page at /account', () => {
    renderAt('/account');
    expect(screen.getByRole('heading', { level: 1, name: 'Account' })).toBeInTheDocument();
  });

  it('renders the All Tools page at /tools', () => {
    renderAt('/tools');
    expect(screen.getByRole('heading', { level: 1, name: 'All Tools' })).toBeInTheDocument();
  });

  it('renders a category page at /tools/<category>', () => {
    renderAt('/tools/japan');
    expect(screen.getByRole('heading', { level: 1, name: 'Japan Tools' })).toBeInTheDocument();
  });

  it('renders a tool page at /tools/<slug>', () => {
    renderAt('/tools/json-formatter');
    expect(
      screen.getByRole('heading', { level: 1, name: 'JSON Formatter / Validator' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['/tools/jpy-to-bdt', 'JPY to BDT Converter'],
    ['/tools/bdt-to-jpy', 'BDT to JPY Converter'],
    ['/tools/currency-converter', 'Currency Converter'],
  ])('renders the currency page at %s', (path, name) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument();
  });

  it('renders a 404 page for an unknown category-shaped path', () => {
    renderAt('/tools/not-a-real-tool-or-category');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('renders a 404 page for a completely unknown path', () => {
    renderAt('/nope');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('App shell', () => {
  it('shows the brand in the header and the footer, and exactly one h1', () => {
    renderAt('/');
    expect(screen.getAllByRole('link', { name: SITE_NAME })).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('has the page landmarks: header, one main, footer', () => {
    renderAt('/');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('offers a skip link as the first focusable element that targets the main region', () => {
    renderAt('/');
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveAttribute('href', '#main');
    expect(document.getElementById('main')).toBe(screen.getByRole('main'));
    expect(document.querySelector('a, button')).toBe(skip);
  });

  it('never links to an in-page section that does not exist', () => {
    renderAt('/');
    const targets = screen
      .getAllByRole('link', { hidden: true })
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => href.includes('#'))
      .map((href) => href.slice(href.indexOf('#') + 1));

    expect(targets.length).toBeGreaterThan(0);
    for (const id of targets) {
      expect(document.getElementById(id), `#${id}`).not.toBeNull();
    }
  });

  it('has no duplicate ids', () => {
    const { container } = renderAt('/');
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
