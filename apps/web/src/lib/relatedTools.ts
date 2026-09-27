import type { ToolMeta } from '@toolora/shared';

/**
 * Deterministic "related tools" for a tool page: same-category tools first, then other
 * categories to fill up to `limit`, always tie-broken by the registry's own `order` field —
 * never a second, manually maintained relationship list. `current` is always excluded, and the
 * result can only ever contain tools present in `tools`, so it can never surface a tool that has
 * been removed from the registry.
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

  return [...sameCategory, ...otherCategories].slice(0, limit);
}
