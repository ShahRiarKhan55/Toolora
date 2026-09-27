import type { ToolMeta } from '@toolora/shared';
import { CATEGORIES } from '@toolora/shared';

const categoryNameById = new Map(CATEGORIES.map((category) => [category.id, category.name]));

/**
 * Local, case-insensitive search over the tool registry: matches name, description, keywords and
 * category name. No backend, no ranking service — just a substring filter, which is enough for a
 * catalogue of this size.
 */
export function searchTools(tools: readonly ToolMeta[], query: string): ToolMeta[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...tools];

  return tools.filter((tool) => {
    const haystack = [
      tool.name,
      tool.description,
      categoryNameById.get(tool.category) ?? tool.category,
      ...tool.keywords,
    ];
    return haystack.some((field) => field.toLowerCase().includes(needle));
  });
}
