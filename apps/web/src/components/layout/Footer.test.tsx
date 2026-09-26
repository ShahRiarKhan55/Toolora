import { SITE_TAGLINE } from '@toolora/shared';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('is the page contentinfo landmark with the brand and tagline', () => {
    render(<Footer />);
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: 'Toolora' })).toHaveAttribute('href', '/');
    expect(footer.getByText(SITE_TAGLINE)).toBeInTheDocument();
  });

  it('links to the categories and the tool list', () => {
    render(<Footer />);
    const categories = within(screen.getByRole('navigation', { name: 'Footer categories' }));
    expect(categories.getByRole('link', { name: 'Japan Tools' })).toHaveAttribute(
      'href',
      '/#japan',
    );
    expect(categories.getByRole('link', { name: 'Student Tools' })).toHaveAttribute(
      'href',
      '/#student',
    );
    expect(categories.getByRole('link', { name: 'Developer Tools' })).toHaveAttribute(
      'href',
      '/#developer',
    );

    const site = within(screen.getByRole('navigation', { name: 'Footer site' }));
    expect(site.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(site.getByRole('link', { name: 'All Tools' })).toHaveAttribute('href', '/#tools');
  });

  it('states the privacy approach without legal or company claims', () => {
    render(<Footer />);
    expect(screen.getByText(/not sent to a server/i)).toBeInTheDocument();
    expect(screen.queryByText(/all rights reserved|terms|inc\.|ltd|llc/i)).not.toBeInTheDocument();
  });

  it('shows a copyright line for the current year', () => {
    render(<Footer />);
    expect(screen.getByText(`© ${new Date().getFullYear()} Toolora`)).toBeInTheDocument();
  });
});
