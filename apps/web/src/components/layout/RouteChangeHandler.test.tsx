import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouteChangeHandler } from './RouteChangeHandler';

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/a']}>
      <RouteChangeHandler />
      <Link to="/b">to b</Link>
      <Link to="/a?q=1">same page, new query</Link>
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="*" element={<p>page</p>} />
        </Routes>
      </main>
    </MemoryRouter>,
  );
}

describe('RouteChangeHandler', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not move focus or scroll on first render', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    renderApp();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(document.body).toHaveFocus();
  });

  it('scrolls to top and focuses <main> when the path changes', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    renderApp();
    fireEvent.click(screen.getByRole('link', { name: 'to b' }));
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('leaves focus alone when only the query string changes', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    renderApp();
    fireEvent.click(screen.getByRole('link', { name: 'same page, new query' }));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
