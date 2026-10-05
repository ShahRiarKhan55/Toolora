import { getToolBySlug, getToolVariantBySlug, toolRoute } from '@toolora/shared';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FAVORITES_KEY,
  forgetBlockedStorageFallback,
  RECENT_KEY,
  recordRecentTool,
} from '../lib/toolPrefs';
import { HomePage } from './home/HomePage';
import { ToolPage } from './tools/ToolPage';

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  forgetBlockedStorageFallback();
  window.localStorage.clear();
});

function renderTool(slug: string) {
  return render(
    <MemoryRouter>
      <ToolPage tool={getToolBySlug(slug)!} />
    </MemoryRouter>,
  );
}
const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('recently used tools', () => {
  it('records a tool when its page opens, as a slug only', () => {
    renderTool('hash-generator');
    expect(JSON.parse(window.localStorage.getItem(RECENT_KEY)!)).toEqual(['hash-generator']);
  });

  it('records the base tool when a currency variant page opens', () => {
    const variant = getToolVariantBySlug('jpy-to-bdt')!;
    render(
      <MemoryRouter>
        <ToolPage tool={getToolBySlug(variant.toolId)!} variant={variant} />
      </MemoryRouter>,
    );
    expect(JSON.parse(window.localStorage.getItem(RECENT_KEY)!)).toEqual(['currency-converter']);
  });

  it('never stores what the visitor types into a tool', async () => {
    renderTool('percentage-calculator');
    fireEvent.change(await screen.findByLabelText('Percentage (X%)', {}, { timeout: 5000 }), {
      target: { value: '12345' },
    });
    expect(JSON.stringify({ ...window.localStorage })).not.toContain('12345');
  });

  it('is not shown on the home page before any tool was opened', () => {
    renderHome();
    expect(screen.queryByRole('region', { name: 'Recently used' })).not.toBeInTheDocument();
  });

  it('is shown on the home page, most recent first, with privacy wording', () => {
    recordRecentTool('uuid-generator');
    recordRecentTool('jwt-decoder');
    renderHome();
    const section = screen.getByRole('region', { name: 'Recently used' });
    const names = within(section)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(names).toEqual(['JWT Decoder', 'UUID Generator']);
    expect(within(section).getByText(/never what you type/)).toBeInTheDocument();
    expect(within(section).getByRole('link', { name: 'JWT Decoder' })).toHaveAttribute(
      'href',
      toolRoute('jwt-decoder'),
    );
  });

  it('can be cleared from the home page, which then hides the section', () => {
    recordRecentTool('uuid-generator');
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Clear recently used' }));
    expect(screen.queryByRole('region', { name: 'Recently used' })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(RECENT_KEY)!)).toEqual([]);
  });

  it('ignores deleted slugs left in storage', () => {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(['removed-tool']));
    renderHome();
    expect(screen.queryByRole('region', { name: 'Recently used' })).not.toBeInTheDocument();
  });

  it('does not break pages when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => renderTool('hash-generator')).not.toThrow();
    expect(screen.getByRole('heading', { level: 1, name: 'Hash Generator' })).toBeInTheDocument();
    expect(() => renderHome()).not.toThrow();
  });
});

describe('favourite tools', () => {
  it('toggles from the tool page with an accessible, keyboard-operable button', () => {
    renderTool('jwt-decoder');
    const add = screen.getByRole('button', { name: 'Add to favorites' });
    expect(add.tagName).toBe('BUTTON');
    fireEvent.click(add);
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY)!)).toEqual(['jwt-decoder']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove from favorites' }));
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY)!)).toEqual([]);
    expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeInTheDocument();
  });

  it('survives a reload', () => {
    const first = renderTool('jwt-decoder');
    fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
    first.unmount();
    renderTool('jwt-decoder');
    expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
  });

  it('is not shown on the home page when there are none', () => {
    renderHome();
    expect(screen.queryByRole('region', { name: 'Your favorites' })).not.toBeInTheDocument();
  });

  it('lists favourites on the home page and updates live', () => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(['hash-generator', 'gone']));
    renderHome();
    const section = screen.getByRole('region', { name: 'Your favorites' });
    expect(within(section).getByRole('link', { name: 'Hash Generator' })).toBeVisible();
    expect(within(section).getAllByRole('heading', { level: 3 })).toHaveLength(1);
    act(() => {
      window.localStorage.setItem(FAVORITES_KEY, '[]');
      window.dispatchEvent(new StorageEvent('storage', { key: FAVORITES_KEY }));
    });
    expect(screen.queryByRole('region', { name: 'Your favorites' })).not.toBeInTheDocument();
  });

  it('gives every card a unique id even when one tool appears in several sections', () => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(['json-formatter']));
    recordRecentTool('json-formatter');
    const { container } = renderHome();
    expect(screen.getAllByRole('link', { name: 'JSON Formatter / Validator' }).length).toBe(3);
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps a valid heading outline on the home page with both sections', () => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(['hash-generator']));
    recordRecentTool('jwt-decoder');
    renderHome();
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });
});
