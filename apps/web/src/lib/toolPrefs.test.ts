import { TOOLS } from '@toolora/shared';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FAVORITES_KEY,
  forgetBlockedStorageFallback,
  MAX_RECENT_TOOLS,
  RECENT_KEY,
  recordRecentTool,
  toggleFavoriteTool,
  useFavoriteTools,
  useIsFavoriteTool,
  useRecentTools,
} from './toolPrefs';

const slugs = TOOLS.map((tool) => tool.slug);
const slugsOf = (tools: { slug: string }[]) => tools.map((tool) => tool.slug);

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  forgetBlockedStorageFallback();
  window.localStorage.clear();
});

describe('recent tools', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useRecentTools());
    expect(result.current).toEqual([]);
  });

  it('puts the most recently used tool first', () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => recordRecentTool(slugs[0]!));
    act(() => recordRecentTool(slugs[1]!));
    expect(slugsOf(result.current)).toEqual([slugs[1], slugs[0]]);
  });

  it('moves a repeated tool to the front without duplicating it', () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => {
      recordRecentTool(slugs[0]!);
      recordRecentTool(slugs[1]!);
      recordRecentTool(slugs[2]!);
      recordRecentTool(slugs[0]!);
    });
    expect(slugsOf(result.current)).toEqual([slugs[0], slugs[2], slugs[1]]);
  });

  it('keeps only the newest few', () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => slugs.slice(0, MAX_RECENT_TOOLS + 3).forEach(recordRecentTool));
    expect(result.current).toHaveLength(MAX_RECENT_TOOLS);
    expect(result.current[0]?.slug).toBe(slugs[MAX_RECENT_TOOLS + 2]);
  });

  it('ignores slugs that are not in the registry', () => {
    const { result } = renderHook(() => useRecentTools());
    act(() => recordRecentTool('no-such-tool'));
    act(() => recordRecentTool(''));
    expect(result.current).toEqual([]);
    expect(window.localStorage.getItem(RECENT_KEY)).toBeNull();
  });

  it('stores nothing but the slugs', () => {
    renderHook(() => useRecentTools());
    act(() => {
      recordRecentTool(slugs[0]!);
      recordRecentTool(slugs[1]!);
    });
    expect(JSON.parse(window.localStorage.getItem(RECENT_KEY)!)).toEqual([slugs[1], slugs[0]]);
  });

  it('survives a reload (a fresh hook reads the stored list)', () => {
    const first = renderHook(() => useRecentTools());
    act(() => recordRecentTool(slugs[3]!));
    first.unmount();
    const second = renderHook(() => useRecentTools());
    expect(slugsOf(second.result.current)).toEqual([slugs[3]]);
  });

  it('drops deleted or unknown slugs, duplicates and non-strings from stored data', () => {
    window.localStorage.setItem(
      RECENT_KEY,
      JSON.stringify([slugs[0], 'deleted-tool', 42, null, slugs[0], slugs[1]]),
    );
    const { result } = renderHook(() => useRecentTools());
    expect(slugsOf(result.current)).toEqual([slugs[0], slugs[1]]);
  });

  it('caps an over-long stored list', () => {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(slugs));
    const { result } = renderHook(() => useRecentTools());
    expect(result.current).toHaveLength(MAX_RECENT_TOOLS);
  });

  it.each(['not json', '{"a":1}', '"text"', '42', 'null'])(
    'treats corrupt stored data %s as empty',
    (raw) => {
      window.localStorage.setItem(RECENT_KEY, raw);
      const { result } = renderHook(() => useRecentTools());
      expect(result.current).toEqual([]);
      act(() => recordRecentTool(slugs[0]!));
      expect(slugsOf(result.current)).toEqual([slugs[0]]);
    },
  );

  it('keeps working for the session when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = renderHook(() => useRecentTools());
    expect(result.current).toEqual([]);
    expect(() => act(() => recordRecentTool(slugs[0]!))).not.toThrow();
    expect(slugsOf(result.current)).toEqual([slugs[0]]);
  });
});

describe('favourite tools', () => {
  it('toggles a favourite on and off', () => {
    const list = renderHook(() => useFavoriteTools());
    const flag = renderHook(() => useIsFavoriteTool(slugs[2]!));
    expect(flag.result.current).toBe(false);

    act(() => toggleFavoriteTool(slugs[2]!));
    expect(slugsOf(list.result.current)).toEqual([slugs[2]]);
    expect(flag.result.current).toBe(true);

    act(() => toggleFavoriteTool(slugs[2]!));
    expect(list.result.current).toEqual([]);
    expect(flag.result.current).toBe(false);
  });

  it('keeps favourites in the order they were added and survives a reload', () => {
    const first = renderHook(() => useFavoriteTools());
    act(() => {
      toggleFavoriteTool(slugs[4]!);
      toggleFavoriteTool(slugs[1]!);
    });
    first.unmount();
    const second = renderHook(() => useFavoriteTools());
    expect(slugsOf(second.result.current)).toEqual([slugs[4], slugs[1]]);
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY)!)).toEqual([slugs[4], slugs[1]]);
  });

  it('ignores unknown slugs, both when toggling and in stored data', () => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(['deleted-tool', slugs[0]]));
    const { result } = renderHook(() => useFavoriteTools());
    expect(slugsOf(result.current)).toEqual([slugs[0]]);
    act(() => toggleFavoriteTool('deleted-tool'));
    expect(slugsOf(result.current)).toEqual([slugs[0]]);
  });

  it('is independent of the recent list', () => {
    const recent = renderHook(() => useRecentTools());
    act(() => toggleFavoriteTool(slugs[0]!));
    expect(recent.result.current).toEqual([]);
  });

  it('does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useIsFavoriteTool(slugs[0]!));
    expect(() => act(() => toggleFavoriteTool(slugs[0]!))).not.toThrow();
    expect(result.current).toBe(true);
  });

  it('follows changes made in another tab', () => {
    const { result } = renderHook(() => useFavoriteTools());
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([slugs[5]]));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: FAVORITES_KEY }));
    });
    expect(slugsOf(result.current)).toEqual([slugs[5]]);
  });
});
