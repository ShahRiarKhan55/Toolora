import type { AccessLevel } from './access';
import { CATEGORIES } from './categories';
import type { Category, CategoryId } from './categories';
import type { CurrencyCode } from './currency';

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
  'regex',
  'table',
  'code',
  'scale',
  'calendar-range',
  'map-pin',
  'phone',
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
  /**
   * Hand-picked ids of genuinely related tools, most relevant first (see `getRelatedTools`). Optional:
   * remaining slots are filled deterministically from the registry. A test checks every id exists,
   * is not the tool itself, and is not repeated.
   */
  related?: readonly string[];
  /**
   * Access level the tool needs; omitted = `'public'`. Declaration only: nothing enforces it yet and
   * every current tool is public. Read it through `requiredAccess`, never directly.
   */
  access?: AccessLevel;
}

// Every tool here is fully implemented and working (see CLAUDE.md: no disabled "coming soon" entries).
// A test in apps/web (registry ↔ implementation parity) fails if a component is missing for one of
// these, or if a component exists with no matching entry.
export const TOOLS: readonly ToolMeta[] = [
  {
    id: 'currency-converter',
    slug: 'currency-converter',
    name: 'Currency Converter',
    description:
      'Convert JPY, BDT, USD, EUR and 12 more currencies using daily reference exchange rates.',
    category: 'currency',
    icon: 'yen',
    keywords: [
      'currency',
      'converter',
      'exchange rate',
      'jpy',
      'yen',
      'bdt',
      'taka',
      'jpy to bdt',
      'bdt to jpy',
      'usd',
      'forex',
    ],
    seoTitle: 'Currency Converter — JPY, BDT & More Exchange Rates — Toolora',
    seoDescription:
      'Free currency converter for JPY, BDT, USD, EUR, GBP and more, using daily reference exchange rates with the rate date shown. Not a bank or transfer rate.',
    // Rates come from Toolora's own /api/currency; the amount you type never leaves the browser.
    localOnly: false,
    order: 1,
    related: [
      'japanese-era-converter',
      'japanese-postal-code-formatter',
      'percentage-grade-calculator',
    ],
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
    related: ['japanese-age-calculator', 'date-difference-calculator', 'currency-converter'],
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
    related: ['date-difference-calculator', 'japanese-era-converter'],
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
    related: ['gpa-percentage-converter', 'percentage-grade-calculator'],
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
    related: ['gpa-percentage-converter', 'gpa-calculator', 'currency-converter'],
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
    related: ['regex-tester'],
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
    related: ['json-to-typescript', 'csv-json-converter', 'base64-encoder-decoder'],
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
    related: ['json-formatter', 'uuid-generator'],
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
    related: ['base64-encoder-decoder', 'unix-timestamp-converter'],
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
    related: ['date-difference-calculator', 'uuid-generator'],
  },
  {
    id: 'regex-tester',
    slug: 'regex-tester',
    name: 'Regex Tester',
    description: 'Test a regular expression against text and see every match, group and position.',
    category: 'developer',
    icon: 'regex',
    keywords: ['regex', 'regular expression', 'regexp', 'pattern', 'match', 'test', 'javascript'],
    seoTitle: 'Regex Tester — Toolora',
    seoDescription:
      'Test JavaScript regular expressions with flags, see every match with its position and capture groups, and get clear errors for invalid patterns.',
    localOnly: true,
    order: 11,
    related: ['json-formatter', 'word-counter'],
  },
  {
    id: 'csv-json-converter',
    slug: 'csv-json-converter',
    name: 'CSV ↔ JSON Converter',
    description: 'Convert CSV to JSON or JSON to CSV, with quoted fields and headers handled.',
    category: 'developer',
    icon: 'table',
    keywords: ['csv', 'json', 'convert', 'spreadsheet', 'table', 'comma separated', 'parser'],
    seoTitle: 'CSV to JSON & JSON to CSV Converter — Toolora',
    seoDescription:
      'Convert CSV to JSON and JSON to CSV in your browser. Handles quoted fields, commas, escaped quotes and newlines inside fields.',
    localOnly: true,
    order: 12,
    related: ['json-formatter', 'json-to-typescript'],
  },
  {
    id: 'json-to-typescript',
    slug: 'json-to-typescript',
    name: 'JSON to TypeScript Converter',
    description:
      'Generate TypeScript interfaces from a JSON sample, including nested objects and arrays.',
    category: 'developer',
    icon: 'code',
    keywords: ['json', 'typescript', 'interface', 'type', 'generate', 'types', 'ts'],
    seoTitle: 'JSON to TypeScript Converter — Toolora',
    seoDescription:
      'Generate TypeScript interfaces from a JSON sample: nested objects, arrays and null values. Nothing is executed or uploaded.',
    localOnly: true,
    order: 13,
    related: ['json-formatter', 'csv-json-converter'],
  },
  {
    id: 'gpa-percentage-converter',
    slug: 'gpa-percentage-converter',
    name: 'GPA ↔ Percentage Converter',
    description:
      'Estimate a percentage from a GPA, or a GPA from a percentage, with a stated formula.',
    category: 'student',
    icon: 'scale',
    keywords: ['gpa', 'percentage', 'convert', 'grade', '4.0 scale', '10 point', '5 point'],
    seoTitle: 'GPA to Percentage Converter — Toolora',
    seoDescription:
      'Estimate percentage from GPA and GPA from percentage on a 4, 5 or 10-point scale with a simple linear formula. Institutions differ, so treat it as an estimate.',
    localOnly: true,
    order: 14,
    related: ['gpa-calculator', 'percentage-grade-calculator'],
  },
  {
    id: 'date-difference-calculator',
    slug: 'date-difference-calculator',
    name: 'Date Difference Calculator',
    description: 'Find the days, weeks and years/months/days between two dates.',
    category: 'student',
    icon: 'calendar-range',
    keywords: ['date difference', 'days between', 'date calculator', 'duration', 'weeks', 'months'],
    seoTitle: 'Date Difference Calculator — Toolora',
    seoDescription:
      'Calculate the days, weeks, months and years between two dates. Leap years are handled, and exact calendar dates are used, not time zones.',
    localOnly: true,
    order: 15,
    related: ['japanese-age-calculator', 'unix-timestamp-converter'],
  },
  {
    id: 'japanese-postal-code-formatter',
    slug: 'japanese-postal-code-formatter',
    name: 'Japanese Postal Code Formatter',
    description: 'Normalize a Japanese postal code to the XXX-XXXX format (formatting only).',
    category: 'japan',
    icon: 'map-pin',
    keywords: ['postal code', 'zip code', 'yubin', 'yuubin bango', '郵便番号', 'format', 'address'],
    seoTitle: 'Japanese Postal Code Formatter — Toolora',
    seoDescription:
      'Format a Japanese postal code as XXX-XXXX from 7 digits, with or without a hyphen. Checks the format only; it does not look up addresses.',
    localOnly: true,
    order: 16,
    related: ['japanese-phone-number-formatter', 'currency-converter'],
  },
  {
    id: 'japanese-phone-number-formatter',
    slug: 'japanese-phone-number-formatter',
    name: 'Japanese Phone Number Formatter',
    description:
      'Tidy Japanese phone numbers into common domestic and +81 formats (formatting only).',
    category: 'japan',
    icon: 'phone',
    keywords: ['phone number', 'telephone', 'denwa', '電話番号', 'mobile', '+81', 'format'],
    seoTitle: 'Japanese Phone Number Formatter — Toolora',
    seoDescription:
      'Format Japanese mobile, toll-free and common landline numbers with hyphens, and convert +81 numbers. Formatting only; numbers are not verified.',
    localOnly: true,
    order: 17,
    related: ['japanese-postal-code-formatter'],
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

/** Categories that have at least one tool: the only ones worth linking to (the rest are noindex). */
export function getPopulatedCategories(): Category[] {
  return CATEGORIES.filter((category) => getToolsByCategory(category.id).length > 0);
}

/** Initial state a variant page hands to its tool's workspace. Only currency pairs exist so far. */
export interface ToolPreset {
  from: CurrencyCode;
  to: CurrencyCode;
}

/**
 * An SEO landing page that is the same tool opened with a preset (`/tools/jpy-to-bdt`): no second
 * implementation and no tool card of its own, only a route, metadata and a preset. Its copy lives in
 * `apps/web/src/tools/currency-converter/variantContent.tsx`, keyed by slug.
 */
export interface ToolVariant {
  /** Same flat namespace as tool slugs and category ids; a test keeps them distinct. */
  slug: string;
  /** Id of the tool in `TOOLS` that renders this page. */
  toolId: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  preset: ToolPreset;
}

export const TOOL_VARIANTS: readonly ToolVariant[] = [
  {
    slug: 'jpy-to-bdt',
    toolId: 'currency-converter',
    name: 'JPY to BDT Converter',
    description:
      'Convert Japanese yen to Bangladeshi taka using the daily reference exchange rate.',
    seoTitle: 'JPY to BDT Converter — Japanese Yen to Taka Rate — Toolora',
    seoDescription:
      'Convert Japanese yen (JPY) to Bangladeshi taka (BDT) with the daily reference exchange rate and its date. Bank and remittance rates differ.',
    preset: { from: 'JPY', to: 'BDT' },
  },
  {
    slug: 'bdt-to-jpy',
    toolId: 'currency-converter',
    name: 'BDT to JPY Converter',
    description:
      'Convert Bangladeshi taka to Japanese yen using the daily reference exchange rate.',
    seoTitle: 'BDT to JPY Converter — Taka to Japanese Yen Rate — Toolora',
    seoDescription:
      'Convert Bangladeshi taka (BDT) to Japanese yen (JPY) with the daily reference exchange rate and its date. Bank and remittance rates differ.',
    preset: { from: 'BDT', to: 'JPY' },
  },
];

export function getToolVariantBySlug(slug: string): ToolVariant | undefined {
  return TOOL_VARIANTS.find((variant) => variant.slug === slug);
}

/** A variant described as the `ToolMeta` its page metadata (title, canonical, JSON-LD) is built from. */
export function toolFromVariant(variant: ToolVariant, tool: ToolMeta): ToolMeta {
  const { slug, name, description, seoTitle, seoDescription } = variant;
  return { ...tool, slug, name, description, seoTitle, seoDescription };
}

/**
 * Routes that used to be tools and now live elsewhere. The server answers each with a permanent
 * redirect (`routes/spa.ts`); they are never in the sitemap, the registry or the web router.
 */
export const LEGACY_TOOL_REDIRECTS: Readonly<Record<string, string>> = {
  [toolRoute('japanese-yen-converter')]: toolRoute('currency-converter'),
};
