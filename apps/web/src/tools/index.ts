import { lazy } from 'react';
import { content as currencyConverterContent } from './currency-converter/content';
import { content as japaneseEraConverterContent } from './japanese-era-converter/content';
import { content as japaneseAgeCalculatorContent } from './japanese-age-calculator/content';
import { content as gpaCalculatorContent } from './gpa-calculator/content';
import { content as percentageGradeCalculatorContent } from './percentage-grade-calculator/content';
import { content as wordCounterContent } from './word-counter/content';
import { content as jsonFormatterContent } from './json-formatter/content';
import { content as base64EncoderDecoderContent } from './base64-encoder-decoder/content';
import { content as uuidGeneratorContent } from './uuid-generator/content';
import { content as unixTimestampConverterContent } from './unix-timestamp-converter/content';
import { content as regexTesterContent } from './regex-tester/content';
import { content as csvJsonConverterContent } from './csv-json-converter/content';
import { content as jsonToTypescriptContent } from './json-to-typescript/content';
import { content as gpaPercentageConverterContent } from './gpa-percentage-converter/content';
import { content as dateDifferenceCalculatorContent } from './date-difference-calculator/content';
import { content as japanesePostalCodeFormatterContent } from './japanese-postal-code-formatter/content';
import { content as japanesePhoneNumberFormatterContent } from './japanese-phone-number-formatter/content';
import { content as urlEncoderDecoderContent } from './url-encoder-decoder/content';
import { content as htmlEntityEncoderDecoderContent } from './html-entity-encoder-decoder/content';
import { content as textCaseConverterContent } from './text-case-converter/content';
import { content as markdownPreviewContent } from './markdown-preview/content';
import { content as compoundInterestCalculatorContent } from './compound-interest-calculator/content';
import { content as loanPaymentCalculatorContent } from './loan-payment-calculator/content';
import { content as timeZoneConverterContent } from './time-zone-converter/content';
import { content as businessDaysCalculatorContent } from './business-days-calculator/content';
import { content as japaneseConsumptionTaxCalculatorContent } from './japanese-consumption-tax-calculator/content';
import { content as kanaWidthConverterContent } from './kana-width-converter/content';
import { content as percentageCalculatorContent } from './percentage-calculator/content';
import { content as textDiffCheckerContent } from './text-diff-checker/content';
import { content as hashGeneratorContent } from './hash-generator/content';
import { content as jwtDecoderContent } from './jwt-decoder/content';
import { variantContent } from './currency-converter/variantContent';
import type { ToolContent, ToolImplementation } from './types';

// The single map from a registry tool id to its lazy-loaded workspace component and its copy.
// `logic.ts`/content are cheap and imported eagerly above; each `<Name>Tool>` component is behind
// its own `import()`, so Vite gives it its own chunk — a tool's code only loads when its page does.
// A test (registry.test.ts) enforces that this map's keys exactly match the shared registry's ids.
export const TOOL_IMPLEMENTATIONS: Readonly<Record<string, ToolImplementation>> = {
  'currency-converter': {
    Component: lazy(() =>
      import('./currency-converter/CurrencyConverterTool').then((m) => ({
        default: m.CurrencyConverterTool,
      })),
    ),
    content: currencyConverterContent,
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
  'regex-tester': {
    Component: lazy(() =>
      import('./regex-tester/RegexTesterTool').then((m) => ({ default: m.RegexTesterTool })),
    ),
    content: regexTesterContent,
  },
  'csv-json-converter': {
    Component: lazy(() =>
      import('./csv-json-converter/CsvJsonConverterTool').then((m) => ({
        default: m.CsvJsonConverterTool,
      })),
    ),
    content: csvJsonConverterContent,
  },
  'json-to-typescript': {
    Component: lazy(() =>
      import('./json-to-typescript/JsonToTypescriptTool').then((m) => ({
        default: m.JsonToTypescriptTool,
      })),
    ),
    content: jsonToTypescriptContent,
  },
  'gpa-percentage-converter': {
    Component: lazy(() =>
      import('./gpa-percentage-converter/GpaPercentageConverterTool').then((m) => ({
        default: m.GpaPercentageConverterTool,
      })),
    ),
    content: gpaPercentageConverterContent,
  },
  'date-difference-calculator': {
    Component: lazy(() =>
      import('./date-difference-calculator/DateDifferenceCalculatorTool').then((m) => ({
        default: m.DateDifferenceCalculatorTool,
      })),
    ),
    content: dateDifferenceCalculatorContent,
  },
  'japanese-postal-code-formatter': {
    Component: lazy(() =>
      import('./japanese-postal-code-formatter/JapanesePostalCodeFormatterTool').then((m) => ({
        default: m.JapanesePostalCodeFormatterTool,
      })),
    ),
    content: japanesePostalCodeFormatterContent,
  },
  'japanese-phone-number-formatter': {
    Component: lazy(() =>
      import('./japanese-phone-number-formatter/JapanesePhoneNumberFormatterTool').then((m) => ({
        default: m.JapanesePhoneNumberFormatterTool,
      })),
    ),
    content: japanesePhoneNumberFormatterContent,
  },
  'url-encoder-decoder': {
    Component: lazy(() =>
      import('./url-encoder-decoder/UrlEncoderDecoderTool').then((m) => ({
        default: m.UrlEncoderDecoderTool,
      })),
    ),
    content: urlEncoderDecoderContent,
  },
  'html-entity-encoder-decoder': {
    Component: lazy(() =>
      import('./html-entity-encoder-decoder/HtmlEntityEncoderDecoderTool').then((m) => ({
        default: m.HtmlEntityEncoderDecoderTool,
      })),
    ),
    content: htmlEntityEncoderDecoderContent,
  },
  'text-case-converter': {
    Component: lazy(() =>
      import('./text-case-converter/TextCaseConverterTool').then((m) => ({
        default: m.TextCaseConverterTool,
      })),
    ),
    content: textCaseConverterContent,
  },
  'markdown-preview': {
    Component: lazy(() =>
      import('./markdown-preview/MarkdownPreviewTool').then((m) => ({
        default: m.MarkdownPreviewTool,
      })),
    ),
    content: markdownPreviewContent,
  },
  'compound-interest-calculator': {
    Component: lazy(() =>
      import('./compound-interest-calculator/CompoundInterestCalculatorTool').then((m) => ({
        default: m.CompoundInterestCalculatorTool,
      })),
    ),
    content: compoundInterestCalculatorContent,
  },
  'loan-payment-calculator': {
    Component: lazy(() =>
      import('./loan-payment-calculator/LoanPaymentCalculatorTool').then((m) => ({
        default: m.LoanPaymentCalculatorTool,
      })),
    ),
    content: loanPaymentCalculatorContent,
  },
  'time-zone-converter': {
    Component: lazy(() =>
      import('./time-zone-converter/TimeZoneConverterTool').then((m) => ({
        default: m.TimeZoneConverterTool,
      })),
    ),
    content: timeZoneConverterContent,
  },
  'business-days-calculator': {
    Component: lazy(() =>
      import('./business-days-calculator/BusinessDaysCalculatorTool').then((m) => ({
        default: m.BusinessDaysCalculatorTool,
      })),
    ),
    content: businessDaysCalculatorContent,
  },
  'japanese-consumption-tax-calculator': {
    Component: lazy(() =>
      import('./japanese-consumption-tax-calculator/JapaneseConsumptionTaxCalculatorTool').then(
        (m) => ({
          default: m.JapaneseConsumptionTaxCalculatorTool,
        }),
      ),
    ),
    content: japaneseConsumptionTaxCalculatorContent,
  },
  'kana-width-converter': {
    Component: lazy(() =>
      import('./kana-width-converter/KanaWidthConverterTool').then((m) => ({
        default: m.KanaWidthConverterTool,
      })),
    ),
    content: kanaWidthConverterContent,
  },
  'percentage-calculator': {
    Component: lazy(() =>
      import('./percentage-calculator/PercentageCalculatorTool').then((m) => ({
        default: m.PercentageCalculatorTool,
      })),
    ),
    content: percentageCalculatorContent,
  },
  'text-diff-checker': {
    Component: lazy(() =>
      import('./text-diff-checker/TextDiffCheckerTool').then((m) => ({
        default: m.TextDiffCheckerTool,
      })),
    ),
    content: textDiffCheckerContent,
  },
  'hash-generator': {
    Component: lazy(() =>
      import('./hash-generator/HashGeneratorTool').then((m) => ({
        default: m.HashGeneratorTool,
      })),
    ),
    content: hashGeneratorContent,
  },
  'jwt-decoder': {
    Component: lazy(() =>
      import('./jwt-decoder/JwtDecoderTool').then((m) => ({
        default: m.JwtDecoderTool,
      })),
    ),
    content: jwtDecoderContent,
  },
};

/** Copy for each `TOOL_VARIANTS` page, by slug (checked against the registry in registry.test.ts). */
export const TOOL_VARIANT_CONTENT: Readonly<Record<string, ToolContent>> = variantContent;
