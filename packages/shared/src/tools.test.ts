import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS } from './categories';
import {
  ALL_TOOLS_ROUTE,
  categoryRoute,
  getToolBySlug,
  getToolsByCategory,
  TOOL_ICON_IDS,
  toolRoute,
  TOOLS,
} from './tools';

describe('TOOLS registry', () => {
  it('is not empty', () => {
    expect(TOOLS.length).toBeGreaterThan(0);
  });

  it('has a unique id per tool', () => {
    const ids = TOOLS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a unique slug per tool', () => {
    const slugs = TOOLS.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses lowercase kebab-case ids and slugs', () => {
    const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const tool of TOOLS) {
      expect(tool.id).toMatch(kebab);
      expect(tool.slug).toMatch(kebab);
    }
  });

  it('never lets a slug collide with a category id (both live under /tools/<param>)', () => {
    for (const tool of TOOLS) {
      expect(CATEGORY_IDS).not.toContain(tool.slug);
    }
  });

  it('assigns every tool a valid, known category', () => {
    for (const tool of TOOLS) {
      expect(CATEGORY_IDS).toContain(tool.category);
    }
  });

  it('assigns every tool a known icon id', () => {
    for (const tool of TOOLS) {
      expect(TOOL_ICON_IDS).toContain(tool.icon);
    }
  });

  it('gives every tool the required non-empty metadata', () => {
    for (const tool of TOOLS) {
      expect(tool.name.trim()).not.toBe('');
      expect(tool.description.trim()).not.toBe('');
      expect(tool.seoTitle.trim()).not.toBe('');
      expect(tool.seoDescription.trim()).not.toBe('');
      expect(tool.keywords.length).toBeGreaterThan(0);
      for (const keyword of tool.keywords) {
        expect(keyword.trim()).not.toBe('');
      }
    }
  });

  it('keeps card descriptions short enough for a card and a meta description', () => {
    for (const tool of TOOLS) {
      expect(tool.description.length).toBeLessThanOrEqual(160);
      expect(tool.seoDescription.length).toBeLessThanOrEqual(200);
    }
  });

  // A copy-pasted registry entry is easy to leave with a stale name/SEO string; catch it here
  // instead of relying on someone noticing during review (see the Phase 3 audit).
  it('gives every tool a unique name, seoTitle and seoDescription', () => {
    const names = TOOLS.map((tool) => tool.name);
    const seoTitles = TOOLS.map((tool) => tool.seoTitle);
    const seoDescriptions = TOOLS.map((tool) => tool.seoDescription);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(seoTitles).size).toBe(seoTitles.length);
    expect(new Set(seoDescriptions).size).toBe(seoDescriptions.length);
  });

  it('marks every MVP tool as running locally in the browser', () => {
    for (const tool of TOOLS) {
      expect(tool.localOnly).toBe(true);
    }
  });

  // `order` also drives the "All tools" listing and related-tool tie-breaks, so a repeat anywhere
  // (not just within a category) would make that ordering depend on array position.
  it('gives every tool a globally unique order, so listings are deterministic', () => {
    const orders = TOOLS.map((tool) => tool.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('derives a unique route per tool', () => {
    const routes = TOOLS.map((tool) => toolRoute(tool.slug));
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('gives every tool a unique description, so cards and meta text never repeat', () => {
    const descriptions = TOOLS.map((tool) => tool.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('gives every tool a unique order within its category', () => {
    for (const category of CATEGORY_IDS) {
      const orders = TOOLS.filter((tool) => tool.category === category).map((tool) => tool.order);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });
});

describe('toolRoute / categoryRoute', () => {
  it('derives /tools/<slug> for a tool', () => {
    expect(toolRoute('json-formatter')).toBe('/tools/json-formatter');
  });

  it('derives /tools/<category> for a category', () => {
    expect(categoryRoute('japan')).toBe('/tools/japan');
  });

  it('has every tool route start with the all-tools route', () => {
    for (const tool of TOOLS) {
      expect(toolRoute(tool.slug).startsWith(`${ALL_TOOLS_ROUTE}/`)).toBe(true);
    }
  });
});

describe('getToolBySlug', () => {
  it('finds a tool by its slug', () => {
    expect(getToolBySlug('uuid-generator')?.name).toBe('UUID Generator');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getToolBySlug('does-not-exist')).toBeUndefined();
  });

  it('returns undefined for an empty slug', () => {
    expect(getToolBySlug('')).toBeUndefined();
  });
});

describe('getToolsByCategory', () => {
  it('returns only tools in the requested category, ordered by `order`', () => {
    const japanTools = getToolsByCategory('japan');
    expect(japanTools.every((tool) => tool.category === 'japan')).toBe(true);
    expect(japanTools).toEqual([...japanTools].sort((a, b) => a.order - b.order));
  });

  it('returns an empty array for a category with no tools yet', () => {
    expect(getToolsByCategory('ai')).toEqual([]);
  });

  it('together with every other category, accounts for every tool exactly once', () => {
    const total = CATEGORY_IDS.reduce((sum, id) => sum + getToolsByCategory(id).length, 0);
    expect(total).toBe(TOOLS.length);
  });
});
