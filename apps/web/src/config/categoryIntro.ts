import type { CategoryId } from '@toolora/shared';

/**
 * Short introductory copy for a category's landing page (paragraphs, in order). Page text only: the
 * title and meta description stay in `CATEGORIES` and `pageMeta.ts`. Categories without an entry
 * simply show no intro.
 */
export const CATEGORY_INTRO: Partial<Record<CategoryId, readonly string[]>> = {
  japan: [
    "Toolora's Japan tools cover practical calculations and everyday tasks for living, studying and working in Japan. For money and work, estimate take-home pay from a salary, check the separate work-hour, tax and insurance limits that apply to students, and estimate a furusato nozei donation limit. For everyday tasks, convert between Western years and Japanese eras, work out an exact age, add or split out the 8% and 10% consumption tax, switch text between hiragana, katakana and full-width or half-width characters, and tidy postal codes and phone numbers.",
    'Toolora is an independent site and is not connected to any government body. The money and work tools are estimates built from published rules and say which year and sources they use. They are not official calculations or professional tax, legal or immigration advice, so check official sources for anything that matters.',
  ],
  currency: [
    'The Currency Converter turns one amount into another currency using daily reference exchange rates. Rates are published once a day, not live, and every result shows the rate date and where it came from.',
    'Banks, cards and money-transfer services add fees and use their own rates, so treat the result as a guide and check your provider before you send money. The amount you type stays in your browser; only the base currency is used to fetch rates.',
  ],
  text: [
    'Small text utilities for writing and editing: change the case of a passage, compare two versions of a text or code snippet line by line, and preview Markdown as you write it.',
    'Everything runs in your browser, so what you paste is never uploaded or stored.',
  ],
  finance: [
    'Calculators for the everyday money questions: percentages and percentage change, how savings grow with compound interest, and what a fixed-rate loan costs each period and in total.',
    'Each tool states its formula and assumptions so you can check the answer. They are estimates for planning, not financial advice, and your numbers stay in your browser.',
  ],
  time: [
    'Tools for scheduling across places and calendars: convert a date and time between time zones, with daylight saving handled by your browser, and count the business days between two dates.',
    'Business days here exclude weekends only. Public holidays differ by country and year and are not accounted for.',
  ],
};
