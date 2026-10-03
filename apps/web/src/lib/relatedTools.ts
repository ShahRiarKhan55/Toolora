import type { ToolMeta } from '@toolora/shared';

/**
 * Deterministic "related tools" for a tool page: the tool's own `related` ids from the registry
 * first (in that order), then same-category tools, then other categories to fill up to `limit`,
 * the fallbacks tie-broken by the registry's `order` field. `current` is always excluded, nothing
 * repeats, and the result can only contain tools present in `tools`, so an id that no longer
 * exists in the registry is silently skipped.
 */
export function getRelatedTools(
  tools: readonly ToolMeta[],
  current: ToolMeta,
  limit = 3,
): ToolMeta[] {
  const byOrder = (a: ToolMeta, b: ToolMeta) => a.order - b.order;
  const others = tools.filter((tool) => tool.id !== current.id);
  const sameCategory = others.filter((tool) => tool.category === current.category).sort(byOrder);
  const otherCategories = others.filter((tool) => tool.category !== current.category).sort(byOrder);

  const curated = (current.related ?? []).flatMap(
    (id) => others.find((tool) => tool.id === id) ?? [],
  );

  return [...new Set([...curated, ...sameCategory, ...otherCategories])].slice(0, limit);
}
