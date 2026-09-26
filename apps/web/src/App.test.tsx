import { SITE_NAME } from '@toolora/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the brand in the header and the footer, and exactly one h1', () => {
    render(<App />);
    expect(screen.getAllByRole('link', { name: SITE_NAME })).toHaveLength(2);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('has the page landmarks: header, one main, footer', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('offers a skip link as the first focusable element that targets the main region', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveAttribute('href', '#main');
    expect(document.getElementById('main')).toBe(screen.getByRole('main'));
    expect(document.querySelector('a, button')).toBe(skip);
  });

  it('never links to a section that does not exist', () => {
    render(<App />);
    const targets = screen
      .getAllByRole('link', { hidden: true })
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('/#') || href.startsWith('#'))
      .map((href) => href.slice(href.indexOf('#') + 1));

    expect(targets.length).toBeGreaterThan(0);
    for (const id of targets) {
      expect(document.getElementById(id), `#${id}`).not.toBeNull();
    }
  });

  it('has no duplicate ids', () => {
    const { container } = render(<App />);
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
