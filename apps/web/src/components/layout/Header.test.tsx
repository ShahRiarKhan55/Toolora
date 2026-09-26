import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from './Header';

const NAV = [
  ['Home', '/'],
  ['Japan', '/#japan'],
  ['Student', '/#student'],
  ['Developer', '/#developer'],
  ['All Tools', '/#tools'],
] as const;

function menuButton() {
  return screen.getByRole('button', { name: 'Menu' });
}

function mobileNav() {
  // Found through the button's aria-controls: a closed menu is hidden, so role queries skip it.
  const menu = document.getElementById(menuButton().getAttribute('aria-controls') ?? '');
  if (!menu) throw new Error('The menu button does not point at an existing element');
  return menu;
}

describe('Header', () => {
  it('shows the brand as a link to the home page', () => {
    render(<Header />);
    const brand = within(screen.getByRole('banner')).getAllByRole('link', { name: 'Toolora' })[0];
    expect(brand).toHaveAttribute('href', '/');
  });

  it('renders the main navigation with every destination', () => {
    render(<Header />);
    const nav = within(screen.getByRole('navigation', { name: 'Main' }));
    for (const [label, href] of NAV) {
      expect(nav.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
  });

  it('does not list AI in the navigation while it has no tools', () => {
    render(<Header />);
    expect(screen.queryByRole('link', { name: /^AI/ })).not.toBeInTheDocument();
  });

  describe('mobile menu', () => {
    it('starts closed, with the state exposed to assistive tech', () => {
      render(<Header />);
      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton()).toHaveAttribute('aria-controls', mobileNav().id);
      expect(mobileNav()).not.toBeVisible();
    });

    it('opens and closes from the menu button', () => {
      render(<Header />);
      fireEvent.click(menuButton());
      expect(menuButton()).toHaveAttribute('aria-expanded', 'true');
      expect(mobileNav()).toBeVisible();
      for (const [label] of NAV) {
        expect(within(mobileNav()).getByRole('link', { name: label })).toBeVisible();
      }

      fireEvent.click(menuButton());
      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
      expect(mobileNav()).not.toBeVisible();
    });

    it('closes on Escape and returns focus to the menu button', () => {
      render(<Header />);
      fireEvent.click(menuButton());
      within(mobileNav()).getByRole('link', { name: 'Japan' }).focus();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mobileNav()).not.toBeVisible();
      expect(menuButton()).toHaveFocus();
    });

    it('closes after a link is chosen', () => {
      render(<Header />);
      fireEvent.click(menuButton());
      fireEvent.click(within(mobileNav()).getByRole('link', { name: 'Student' }));
      expect(mobileNav()).not.toBeVisible();
      expect(menuButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes when pressing outside the header, but not inside it', () => {
      render(<Header />);
      fireEvent.click(menuButton());

      fireEvent.pointerDown(within(screen.getByRole('banner')).getAllByRole('link')[0]!);
      expect(mobileNav()).toBeVisible();

      fireEvent.pointerDown(document.body);
      expect(mobileNav()).not.toBeVisible();
    });

    it('leaves page scrolling alone', () => {
      render(<Header />);
      fireEvent.click(menuButton());
      expect(document.body.style.overflow).toBe('');
      expect(document.documentElement.style.overflow).toBe('');
    });
  });
});
