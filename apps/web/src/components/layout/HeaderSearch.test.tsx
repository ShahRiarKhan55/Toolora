import { getToolBySlug, toolRoute, TOOLS } from '@toolora/shared';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { searchTools } from '../../lib/searchTools';
import { Header } from './Header';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/start']}>
      <Header />
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

const toggle = () => screen.getByRole('button', { name: 'Search tools' });
const input = () => screen.getByRole('searchbox', { name: 'Find a tool' });
const where = () => screen.getByTestId('where').textContent;

describe('header search', () => {
  it('is closed at first, with its state exposed to assistive tech', () => {
    renderHeader();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('opens from the button and moves focus into the box', () => {
    renderHeader();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(input()).toBeVisible();
    expect(input()).toHaveFocus();
  });

  it('lists matching tools as links to their pages, using the shared search', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.change(input(), { target: { value: 'json' } });
    const expected = searchTools(TOOLS, 'json');
    expect(expected.length).toBeGreaterThan(1);
    expect(screen.getByRole('status')).toHaveTextContent(`${expected.length} tools found.`);
    for (const tool of expected.slice(0, 6)) {
      expect(screen.getByRole('link', { name: new RegExp(`^${tool.name}`) })).toHaveAttribute(
        'href',
        toolRoute(tool.slug),
      );
    }
  });

  it('finds the new tools by keyword, including Japanese keywords', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.change(input(), { target: { value: '消費税' } });
    expect(screen.getByRole('link', { name: /Japanese Consumption Tax Calculator/ })).toBeVisible();
    fireEvent.change(input(), { target: { value: 'sha256' } });
    expect(screen.getByRole('link', { name: /Hash Generator/ })).toBeVisible();
  });

  it('says so when nothing matches, and shows no links', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.change(input(), { target: { value: 'zzzzqq' } });
    expect(screen.getByRole('status')).toHaveTextContent('No tools match “zzzzqq”.');
    expect(within(screen.getByRole('search')).queryAllByRole('link')).toHaveLength(0);
  });

  it('shows no results while the box is empty or only spaces', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.change(input(), { target: { value: '   ' } });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('caps the list and offers the full result page', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.change(input(), { target: { value: 'a' } });
    const total = searchTools(TOOLS, 'a').length;
    expect(total).toBeGreaterThan(6);
    const more = screen.getByRole('link', { name: `See all ${total} results` });
    expect(more).toHaveAttribute('href', '/tools?q=a');
  });

  it('goes to the full results on Enter, then closes and clears', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.change(input(), { target: { value: 'jwt token' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(where()).toBe('/tools?q=jwt%20token');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle());
    expect(input()).toHaveValue('');
  });

  it('ignores Enter on an empty box', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.submit(screen.getByRole('search'));
    expect(where()).toBe('/start');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens a result and closes the panel', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.change(input(), { target: { value: 'hash gen' } });
    fireEvent.click(screen.getByRole('link', { name: /Hash Generator/ }));
    expect(where()).toBe(toolRoute(getToolBySlug('hash-generator')!.slug));
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape and returns focus to the button', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveFocus();
  });

  it('closes when pressing outside the header', () => {
    renderHeader();
    fireEvent.click(toggle());
    fireEvent.pointerDown(document.body);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the search and the mobile menu from being open together', () => {
    renderHeader();
    const menu = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle());
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(menu);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });
});
