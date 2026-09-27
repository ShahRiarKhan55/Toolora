import { SITE_TAGLINE } from '@toolora/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it('is the page contentinfo landmark with the brand and tagline', () => {
    renderFooter();
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: 'Toolora' })).toHaveAttribute('href', '/');
    expect(footer.getByText(SITE_TAGLINE)).toBeInTheDocument();
  });

  it('links to the categories and the tool list', () => {
    renderFooter();
    const categories = within(screen.getByRole('navigation', { name: 'Footer categories' }));
    expect(categories.getByRole('link', { name: 'Japan Tools' })).toHaveAttribute(
      'href',
      '/tools/japan',
    );
    expect(categories.getByRole('link', { name: 'Student Tools' })).toHaveAttribute(
      'href',
      '/tools/student',
    );
    expect(categories.getByRole('link', { name: 'Developer Tools' })).toHaveAttribute(
      'href',
      '/tools/developer',
    );

    const site = within(screen.getByRole('navigation', { name: 'Footer site' }));
    expect(site.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(site.getByRole('link', { name: 'All Tools' })).toHaveAttribute('href', '/tools');
  });

  it('states the privacy approach without legal or company claims', () => {
    renderFooter();
    expect(screen.getByText(/not sent to a server/i)).toBeInTheDocument();
    expect(screen.queryByText(/all rights reserved|terms|inc\.|ltd|llc/i)).not.toBeInTheDocument();
  });

  it('shows a copyright line for the current year', () => {
    renderFooter();
    expect(screen.getByText(`© ${new Date().getFullYear()} Toolora`)).toBeInTheDocument();
  });
});
