import { getToolBySlug } from '@toolora/shared';
import type { ToolMeta } from '@toolora/shared';
import { useMemo, useSyncExternalStore } from 'react';

// Recently used tools and favourites. Privacy: only tool slugs (public registry ids) are stored, in
// this browser's localStorage; never tool input, results or anything sent to the server.

export const RECENT_KEY = 'toolora:recent-tools';
export const FAVORITES_KEY = 'toolora:favorite-tools';
export const MAX_RECENT_TOOLS = 5;

/** Known, distinct slugs from stored JSON; anything else (corrupt data, deleted tools) is dropped. */
function parseSlugs(raw: string | null, limit: number): readonly string[] {
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const valid = parsed.filter((s): s is string => typeof s === 'string' && !!getToolBySlug(s));
  return [...new Set(valid)].slice(0, limit);
}

function createSlugStore(key: string, limit: number) {
  const listeners = new Set<() => void>();
  // When storage is blocked the list still works for this page view, held here instead.
  let memory: string | null | undefined;
  let lastRaw: string | null = null;
  let lastSlugs: readonly string[] = [];

  const readRaw = (): string | null => {
    if (memory !== undefined) return memory;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const notify = () => listeners.forEach((listener) => listener());

  // useSyncExternalStore needs the same array back until the data really changes, so it is memoised
  // on the raw string; storage stays the single source of truth (no cache to reset or go stale).
  const get = (): readonly string[] => {
    const raw = readRaw();
    if (raw !== lastRaw) {
      lastRaw = raw;
      lastSlugs = parseSlugs(raw, limit);
    }
    return lastSlugs;
  };

  const set = (slugs: readonly string[]) => {
    const raw = JSON.stringify(slugs);
    try {
      window.localStorage.setItem(key, raw);
      memory = undefined;
    } catch {
      memory = raw;
    }
    notify();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    // Another tab changed the list.
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  };

  /** Forget the blocked-storage fallback, so the next read comes from localStorage again. */
  const forget = () => {
    memory = undefined;
  };

  return { get, set, subscribe, forget };
}

const recentStore = createSlugStore(RECENT_KEY, MAX_RECENT_TOOLS);
const favoritesStore = createSlugStore(FAVORITES_KEY, Number.MAX_SAFE_INTEGER);

/** Records that a tool page was opened: moves it to the front, keeps the newest few. Unknown slugs are ignored. */
export function recordRecentTool(slug: string): void {
  if (!getToolBySlug(slug)) return;
  const current = recentStore.get();
  if (current[0] === slug) return;
  recentStore.set([slug, ...current.filter((s) => s !== slug)].slice(0, MAX_RECENT_TOOLS));
}

export function clearRecentTools(): void {
  recentStore.set([]);
}

export function toggleFavoriteTool(slug: string): void {
  if (!getToolBySlug(slug)) return;
  const current = favoritesStore.get();
  favoritesStore.set(
    current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
  );
}

function useTools(store: ReturnType<typeof createSlugStore>): ToolMeta[] {
  const slugs = useSyncExternalStore(store.subscribe, store.get, () => []);
  return useMemo(() => slugs.flatMap((slug) => getToolBySlug(slug) ?? []), [slugs]);
}

/** Test hook: drop the in-memory fallback kept while storage was blocked. */
export function forgetBlockedStorageFallback(): void {
  recentStore.forget();
  favoritesStore.forget();
}

/** Recently opened tools, most recent first. */
export const useRecentTools = () => useTools(recentStore);

/** Favourite tools, oldest favourite first. */
export const useFavoriteTools = () => useTools(favoritesStore);

export function useIsFavoriteTool(slug: string): boolean {
  return useSyncExternalStore(
    favoritesStore.subscribe,
    () => favoritesStore.get().includes(slug),
    () => false,
  );
}
