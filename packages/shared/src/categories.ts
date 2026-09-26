// Site-structure constants, not the tool registry (Phase 3): which categories exist and how they are
// described. The registry's `ToolMeta.category` will reuse `CategoryId`.

export const CATEGORY_IDS = ['japan', 'student', 'developer', 'ai'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Category {
  id: CategoryId;
  /** Short name used in navigation ("Japan"); headings append "Tools". */
  name: string;
  description: string;
}

/** Display order: header, footer and the home page all follow this list. */
export const CATEGORIES: readonly Category[] = [
  {
    id: 'japan',
    name: 'Japan',
    description: 'Yen, era and age helpers for life, study and work in Japan.',
  },
  {
    id: 'student',
    name: 'Student',
    description: 'Grades, percentages and word counts for assignments and coursework.',
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'JSON, Base64, UUID and timestamp utilities for everyday development.',
  },
  {
    id: 'ai',
    name: 'AI',
    description: 'Helpers built on AI models. Not started yet, and planned for later.',
  },
];
