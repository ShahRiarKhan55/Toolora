import type { CategoryId } from './categories';

// The tool icon identifiers a ToolMeta can reference. Kept here (not in `apps/web`) so the registry
// stays the single source of truth; `apps/web/src/config/toolPresentation.ts` maps each id to a real
// icon component, and a `Record<ToolIconId, ...>` there is a compile error until every id is styled.
export const TOOL_ICON_IDS = [
  'yen',
  'calendar',
  'cake',
  'graduation-cap',
  'percent',
  'text',
  'braces',
  'binary',
  'key',
  'clock',
] as const;

export type ToolIconId = (typeof TOOL_ICON_IDS)[number];

export interface ToolMeta {
  /** Unique, kebab-case; equals the folder name in `apps/web/src/tools/`. */
  id: string;
  /** URL segment: the tool's route is `/tools/<slug>` (see `toolRoute`). */
  slug: string;
  name: string;
  /** Short description for cards; also the default meta description if `seoDescription` is not set. */
  description: string;
  category: CategoryId;
  icon: ToolIconId;
  /** Search synonyms ("jpy", "epoch", ...), matched by `searchTools` alongside name/description/category. */
  keywords: readonly string[];
  seoTitle: string;
  seoDescription: string;
  /** True for every MVP tool: it runs entirely in the browser and never sends input to a server. */
  localOnly: boolean;
  /** Manual display order within a category and across "All tools". */
  order: number;
}

// Every tool here is fully implemented and working (see CLAUDE.md: no disabled "coming soon" entries).
// A test in apps/web (registry ↔ implementation parity) fails if a component is missing for one of
// these, or if a component exists with no matching entry.
export const TOOLS: readonly ToolMeta[] = [
  {
    id: 'japanese-yen-converter',
    slug: 'japanese-yen-converter',
    name: 'Japanese Yen Converter',
    description: 'Convert Japanese yen to other currencies using reference rates you can edit.',
    category: 'japan',
    icon: 'yen',
    keywords: ['yen', 'jpy', 'currency', 'convert', 'exchange rate', 'japan money', 'forex'],
    seoTitle: 'Japanese Yen Converter — Toolora',
    seoDescription:
      'Convert Japanese yen (JPY) to USD, EUR, GBP and more with editable reference rates. Not live market rates. Runs in your browser.',
    localOnly: true,
    order: 1,
  },
  {
    id: 'japanese-era-converter',
    slug: 'japanese-era-converter',
    name: 'Japanese Era Converter',
    description: 'Convert between Gregorian years and Japanese era names: Meiji to Reiwa.',
    category: 'japan',
    icon: 'calendar',
    keywords: [
      'era',
      'gengo',
      'meiji',
      'taisho',
      'showa',
      'heisei',
      'reiwa',
      'japanese calendar',
      'year',
    ],
    seoTitle: 'Japanese Era Converter — Toolora',
    seoDescription:
      'Convert Gregorian dates to Japanese era notation (Meiji, Taisho, Showa, Heisei, Reiwa) and back, with valid-range checks.',
    localOnly: true,
    order: 2,
  },
  {
    id: 'japanese-age-calculator',
    slug: 'japanese-age-calculator',
    name: 'Japanese Age Calculator',
    description: 'Calculate exact age in years, months and days from a date of birth.',
    category: 'japan',
    icon: 'cake',
    keywords: ['age', 'birthday', 'date of birth', 'kazoedoshi', 'years old', 'next birthday'],
    seoTitle: 'Japanese Age Calculator — Toolora',
    seoDescription:
      'Calculate age in years, months and days from a birth date, plus days until the next birthday. Handles leap-day birthdays.',
    localOnly: true,
    order: 3,
  },
  {
    id: 'gpa-calculator',
    slug: 'gpa-calculator',
    name: 'GPA Calculator',
    description: 'Add courses with credits and grades to calculate a weighted GPA.',
    category: 'student',
    icon: 'graduation-cap',
    keywords: ['gpa', 'grade point average', 'credits', 'courses', 'weighted average', 'grades'],
    seoTitle: 'GPA Calculator — Toolora',
    seoDescription:
      'Calculate your weighted grade point average from course credits and letter grades on a configurable 4.0 scale.',
    localOnly: true,
    order: 4,
  },
  {
    id: 'percentage-grade-calculator',
    slug: 'percentage-grade-calculator',
    name: 'Percentage / Grade Calculator',
    description: 'Work out percentages, marks, percentage change, and a letter grade.',
    category: 'student',
    icon: 'percent',
    keywords: [
      'percentage',
      'percent change',
      'marks',
      'grade calculator',
      'obtained marks',
      'score',
    ],
    seoTitle: 'Percentage & Grade Calculator — Toolora',
    seoDescription:
      'Calculate percentage from marks, marks from a percentage, percentage change, and a letter grade on a default scale.',
    localOnly: true,
    order: 5,
  },
  {
    id: 'word-counter',
    slug: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, sentences and paragraphs, and estimate reading time.',
    category: 'student',
    icon: 'text',
    keywords: ['word count', 'character count', 'reading time', 'text counter', 'sentence count'],
    seoTitle: 'Word Counter — Toolora',
    seoDescription:
      'Count words, characters (with and without spaces), sentences and paragraphs, with estimated reading time.',
    localOnly: true,
    order: 6,
  },
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'JSON Formatter / Validator',
    description: 'Format, validate and minify JSON, with clear error messages.',
    category: 'developer',
    icon: 'braces',
    keywords: ['json', 'formatter', 'validator', 'pretty print', 'minify', 'lint'],
    seoTitle: 'JSON Formatter & Validator — Toolora',
    seoDescription:
      'Format, validate and minify JSON online with clear, precise error messages. Safe parsing, nothing is executed.',
    localOnly: true,
    order: 7,
  },
  {
    id: 'base64-encoder-decoder',
    slug: 'base64-encoder-decoder',
    name: 'Base64 Encoder / Decoder',
    description: 'Encode text to Base64 or decode Base64 back to text, with full Unicode support.',
    category: 'developer',
    icon: 'binary',
    keywords: ['base64', 'encode', 'decode', 'unicode', 'utf-8', 'converter'],
    seoTitle: 'Base64 Encoder & Decoder — Toolora',
    seoDescription:
      'Encode text to Base64 or decode Base64 to text, with correct Unicode/UTF-8 handling and invalid-input detection.',
    localOnly: true,
    order: 8,
  },
  {
    id: 'uuid-generator',
    slug: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Generate one or many cryptographically random UUID v4 values.',
    category: 'developer',
    icon: 'key',
    keywords: ['uuid', 'guid', 'unique id', 'v4', 'random id', 'generator'],
    seoTitle: 'UUID Generator — Toolora',
    seoDescription:
      'Generate cryptographically random UUID v4 values, one at a time or in bulk, with one-click copy.',
    localOnly: true,
    order: 9,
  },
  {
    id: 'unix-timestamp-converter',
    slug: 'unix-timestamp-converter',
    name: 'Unix Timestamp Converter',
    description: 'Convert Unix timestamps to readable dates and back, in seconds or milliseconds.',
    category: 'developer',
    icon: 'clock',
    keywords: ['unix timestamp', 'epoch', 'date converter', 'utc', 'seconds', 'milliseconds'],
    seoTitle: 'Unix Timestamp Converter — Toolora',
    seoDescription:
      'Convert Unix epoch timestamps (seconds or milliseconds) to local and UTC date/time, and back, entirely in your browser.',
    localOnly: true,
    order: 10,
  },
];

/** The tool's route. Never store this: it is always derived from the slug. */
export function toolRoute(slug: string): string {
  return `/tools/${slug}`;
}

/** A category's tool-listing route. Never store this: it is always derived from the category id. */
export function categoryRoute(category: CategoryId): string {
  return `/tools/${category}`;
}

export const ALL_TOOLS_ROUTE = '/tools';

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: CategoryId): ToolMeta[] {
  return TOOLS.filter((tool) => tool.category === category).sort((a, b) => a.order - b.order);
}
