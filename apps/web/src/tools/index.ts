import { lazy } from 'react';
import { content as japaneseYenConverterContent } from './japanese-yen-converter/content';
import { content as japaneseEraConverterContent } from './japanese-era-converter/content';
import { content as japaneseAgeCalculatorContent } from './japanese-age-calculator/content';
import { content as gpaCalculatorContent } from './gpa-calculator/content';
import { content as percentageGradeCalculatorContent } from './percentage-grade-calculator/content';
import { content as wordCounterContent } from './word-counter/content';
import { content as jsonFormatterContent } from './json-formatter/content';
import { content as base64EncoderDecoderContent } from './base64-encoder-decoder/content';
import { content as uuidGeneratorContent } from './uuid-generator/content';
import { content as unixTimestampConverterContent } from './unix-timestamp-converter/content';
import type { ToolImplementation } from './types';

// The single map from a registry tool id to its lazy-loaded workspace component and its copy.
// `logic.ts`/content are cheap and imported eagerly above; each `<Name>Tool>` component is behind
// its own `import()`, so Vite gives it its own chunk — a tool's code only loads when its page does.
// A test (registry.test.ts) enforces that this map's keys exactly match the shared registry's ids.
export const TOOL_IMPLEMENTATIONS: Readonly<Record<string, ToolImplementation>> = {
  'japanese-yen-converter': {
    Component: lazy(() =>
      import('./japanese-yen-converter/JapaneseYenConverterTool').then((m) => ({
        default: m.JapaneseYenConverterTool,
      })),
    ),
    content: japaneseYenConverterContent,
  },
  'japanese-era-converter': {
    Component: lazy(() =>
      import('./japanese-era-converter/JapaneseEraConverterTool').then((m) => ({
        default: m.JapaneseEraConverterTool,
      })),
    ),
    content: japaneseEraConverterContent,
  },
  'japanese-age-calculator': {
    Component: lazy(() =>
      import('./japanese-age-calculator/JapaneseAgeCalculatorTool').then((m) => ({
        default: m.JapaneseAgeCalculatorTool,
      })),
    ),
    content: japaneseAgeCalculatorContent,
  },
  'gpa-calculator': {
    Component: lazy(() =>
      import('./gpa-calculator/GpaCalculatorTool').then((m) => ({ default: m.GpaCalculatorTool })),
    ),
    content: gpaCalculatorContent,
  },
  'percentage-grade-calculator': {
    Component: lazy(() =>
      import('./percentage-grade-calculator/PercentageGradeCalculatorTool').then((m) => ({
        default: m.PercentageGradeCalculatorTool,
      })),
    ),
    content: percentageGradeCalculatorContent,
  },
  'word-counter': {
    Component: lazy(() =>
      import('./word-counter/WordCounterTool').then((m) => ({ default: m.WordCounterTool })),
    ),
    content: wordCounterContent,
  },
  'json-formatter': {
    Component: lazy(() =>
      import('./json-formatter/JsonFormatterTool').then((m) => ({ default: m.JsonFormatterTool })),
    ),
    content: jsonFormatterContent,
  },
  'base64-encoder-decoder': {
    Component: lazy(() =>
      import('./base64-encoder-decoder/Base64EncoderDecoderTool').then((m) => ({
        default: m.Base64EncoderDecoderTool,
      })),
    ),
    content: base64EncoderDecoderContent,
  },
  'uuid-generator': {
    Component: lazy(() =>
      import('./uuid-generator/UuidGeneratorTool').then((m) => ({ default: m.UuidGeneratorTool })),
    ),
    content: uuidGeneratorContent,
  },
  'unix-timestamp-converter': {
    Component: lazy(() =>
      import('./unix-timestamp-converter/UnixTimestampConverterTool').then((m) => ({
        default: m.UnixTimestampConverterTool,
      })),
    ),
    content: unixTimestampConverterContent,
  },
};
