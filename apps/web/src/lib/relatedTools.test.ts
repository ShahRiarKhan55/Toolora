import { TOOLS } from '@toolora/shared';
import type { ToolMeta } from '@toolora/shared';
import { describe, expect, it } from 'vitest';
import { getRelatedTools } from './relatedTools';

function tool(
  overrides: Partial<ToolMeta> & Pick<ToolMeta, 'id' | 'category' | 'order'>,
): ToolMeta {
  return {
    slug: overrides.id,
    name: overrides.id,
    description: `${overrides.id} description`,
    icon: 'key',
    keywords: ['x'],
    seoTitle: overrides.id,
    seoDescription: `${overrides.id} description`,
    localOnly: true,
    ...overrides,
  };
}

describe('getRelatedTools', () => {
  it('puts curated related ids first, then fills from the same category', () => {
    const a = tool({ id: 'a', category: 'developer', order: 1 });
    const b = tool({ id: 'b', category: 'student', order: 2 });
    const current = tool({ id: 'current', category: 'developer', order: 3, related: ['b'] });
    expect(getRelatedTools([a, b, current], current, 3).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('ignores curated ids that are the tool itself, unknown, or repeated', () => {
    const a = tool({ id: 'a', category: 'developer', order: 1 });
    const current = tool({
      id: 'current',
      category: 'developer',
      order: 2,
      related: ['current', 'ghost', 'a', 'a'],
    });
    expect(getRelatedTools([a, current], current, 3).map((t) => t.id)).toEqual(['a']);
  });

  it('gives every real tool the full set of unique, non-self related tools', () => {
    for (const current of TOOLS) {
      const ids = getRelatedTools(TOOLS, current).map((t) => t.id);
      expect(ids, current.id).toHaveLength(3);
      expect(new Set(ids).size, current.id).toBe(ids.length);
      expect(ids, current.id).not.toContain(current.id);
    }
  });

  it('links to every tool from at least one other tool page (no orphans)', () => {
    const linked = new Set(TOOLS.flatMap((t) => getRelatedTools(TOOLS, t).map((r) => r.id)));
    expect(TOOLS.filter((t) => !linked.has(t.id)).map((t) => t.id)).toEqual([]);
  });

  it('never includes the current tool', () => {
    const current = TOOLS.find((t) => t.id === 'gpa-calculator')!;
    const related = getRelatedTools(TOOLS, current);
    expect(related.some((t) => t.id === current.id)).toBe(false);
  });

  it('prefers same-category tools before other categories', () => {
    const a = tool({ id: 'a', category: 'developer', order: 1 });
    const b = tool({ id: 'b', category: 'developer', order: 2 });
    const c = tool({ id: 'c', category: 'student', order: 1 });
    const current = tool({ id: 'current', category: 'developer', order: 3 });

    const related = getRelatedTools([a, b, c, current], current, 3);
    expect(related.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('is deterministic: repeated calls with the same input return the same order', () => {
    const current = TOOLS.find((t) => t.id === 'json-formatter')!;
    const first = getRelatedTools(TOOLS, current).map((t) => t.id);
    const second = getRelatedTools(TOOLS, current).map((t) => t.id);
    expect(first).toEqual(second);
  });

  it('orders same-category candidates by the registry order field, not array position', () => {
    const later = tool({ id: 'later', category: 'developer', order: 5 });
    const earlier = tool({ id: 'earlier', category: 'developer', order: 1 });
    const current = tool({ id: 'current', category: 'developer', order: 3 });

    // `later` appears first in the input array, but `earlier` has the lower `order`.
    const related = getRelatedTools([later, earlier, current], current, 2);
    expect(related.map((t) => t.id)).toEqual(['earlier', 'later']);
  });

  it('backfills with other categories, in order, once same-category tools run out', () => {
    const a = tool({ id: 'a', category: 'developer', order: 1 });
    const b = tool({ id: 'b', category: 'student', order: 2 });
    const c = tool({ id: 'c', category: 'student', order: 1 });
    const current = tool({ id: 'current', category: 'developer', order: 2 });

    const related = getRelatedTools([a, b, c, current], current, 3);
    expect(related.map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('never returns more than the requested limit', () => {
    const current = TOOLS.find((t) => t.id === 'word-counter')!;
    expect(getRelatedTools(TOOLS, current, 2)).toHaveLength(2);
  });

  it('never returns a tool that is not in the given list', () => {
    const current = TOOLS.find((t) => t.id === 'uuid-generator')!;
    const subset = TOOLS.filter((t) => t.category === 'japan');
    const related = getRelatedTools([...subset, current], current, 10);
    expect(related.every((t) => subset.includes(t))).toBe(true);
  });

  it('returns fewer than the limit when there are not enough other tools', () => {
    const current = tool({ id: 'current', category: 'developer', order: 1 });
    const only = tool({ id: 'only', category: 'developer', order: 2 });
    expect(getRelatedTools([current, only], current, 4)).toEqual([only]);
  });

  it('returns an empty array when the current tool is the only one', () => {
    const current = tool({ id: 'current', category: 'developer', order: 1 });
    expect(getRelatedTools([current], current)).toEqual([]);
  });

  it('defaults to a limit of 3 for the real registry', () => {
    const current = TOOLS.find((t) => t.id === 'currency-converter')!;
    expect(getRelatedTools(TOOLS, current)).toHaveLength(3);
  });
});
