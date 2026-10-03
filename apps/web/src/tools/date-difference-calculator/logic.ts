import { compareDates, daysInMonth, parseIsoDate, toIsoString, toUtcDate } from '../../lib/isoDate';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DateDifferenceError = 'invalid-start-date' | 'invalid-end-date';

export const DATE_DIFFERENCE_ERROR_MESSAGES: Record<DateDifferenceError, string> = {
  'invalid-start-date': 'Enter a valid start date (YYYY-MM-DD).',
  'invalid-end-date': 'Enter a valid end date (YYYY-MM-DD).',
};

export interface DateDifference {
  /** True when the end date was earlier than the start date; the dates below are then swapped. */
  reversed: boolean;
  earlier: string;
  later: string;
  totalDays: number;
  /** `totalDays` split as whole weeks plus leftover days. */
  weeks: number;
  extraDays: number;
  /** Calendar breakdown: whole years, then whole months, then days. */
  years: number;
  months: number;
  days: number;
}

export type DateDifferenceOutcome =
  { ok: true; value: DateDifference } | { ok: false; error: DateDifferenceError };

/**
 * Difference between two `YYYY-MM-DD` dates (strict ISO, no locale parsing). Order does not matter:
 * a reversed pair is swapped and flagged. The year/month/day breakdown subtracts field by field and
 * borrows the lengths of the months before the later date when days run short (the same convention as
 * the age calculator). The end date is not counted (1 Jan to 2 Jan is 1 day).
 */
export function calculateDateDifference(
  startInput: string,
  endInput: string,
): DateDifferenceOutcome {
  const start = parseIsoDate(startInput);
  if (!start) return { ok: false, error: 'invalid-start-date' };
  const end = parseIsoDate(endInput);
  if (!end) return { ok: false, error: 'invalid-end-date' };

  const reversed = compareDates(start, end) > 0;
  const [from, to] = reversed ? [end, start] : [start, end];

  let years = to.year - from.year;
  let months = to.month - from.month;
  let days = to.day - from.day;

  // Borrow whole months until the day count is non-negative (a 31st can need more than one month).
  let borrowMonth = to.month;
  let borrowYear = to.year;
  while (days < 0) {
    borrowMonth -= 1;
    if (borrowMonth < 1) {
      borrowMonth = 12;
      borrowYear -= 1;
    }
    days += daysInMonth(borrowYear, borrowMonth);
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY);

  return {
    ok: true,
    value: {
      reversed,
      earlier: toIsoString(from),
      later: toIsoString(to),
      totalDays,
      weeks: Math.floor(totalDays / 7),
      extraDays: totalDays % 7,
      years,
      months,
      days,
    },
  };
}
