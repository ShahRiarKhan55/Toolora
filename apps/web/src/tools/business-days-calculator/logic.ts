import { compareDates, parseIsoDate, toUtcDate } from '../../lib/isoDate';

export type BusinessDaysError = 'missing-start' | 'missing-end' | 'invalid-start' | 'invalid-end';

export const BUSINESS_DAYS_ERROR_MESSAGES: Record<BusinessDaysError, string> = {
  'missing-start': 'Enter a start date.',
  'missing-end': 'Enter an end date.',
  'invalid-start': 'The start date is not a valid date.',
  'invalid-end': 'The end date is not a valid date.',
};

export interface BusinessDaysOptions {
  includeStart: boolean;
  includeEnd: boolean;
}

export interface BusinessDaysResult {
  /** Monday–Friday days in the counted range. */
  businessDays: number;
  weekendDays: number;
  /** Every day in the counted range: businessDays + weekendDays. */
  calendarDays: number;
  /** True when the end date was before the start date, so they were swapped. */
  reversed: boolean;
  earlier: string;
  later: string;
}

const DAY_MS = 86_400_000;

export function countBusinessDays(
  start: string,
  end: string,
  { includeStart, includeEnd }: BusinessDaysOptions,
): { ok: true; value: BusinessDaysResult } | { ok: false; error: BusinessDaysError } {
  if (start.trim() === '') return { ok: false, error: 'missing-start' };
  if (end.trim() === '') return { ok: false, error: 'missing-end' };
  const a = parseIsoDate(start);
  const b = parseIsoDate(end);
  if (!a) return { ok: false, error: 'invalid-start' };
  if (!b) return { ok: false, error: 'invalid-end' };

  const reversed = compareDates(a, b) > 0;
  const [first, last] = reversed ? [b, a] : [a, b];
  // UTC midnights: no daylight-saving drift, so each step is exactly one calendar day.
  const from = toUtcDate(first).getTime() + (includeStart ? 0 : DAY_MS);
  const to = toUtcDate(last).getTime() - (includeEnd ? 0 : DAY_MS);

  let businessDays = 0;
  let calendarDays = 0;
  for (let t = from; t <= to; t += DAY_MS) {
    calendarDays++;
    const weekday = new Date(t).getUTCDay();
    if (weekday !== 0 && weekday !== 6) businessDays++;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const iso = (d: typeof a) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
  return {
    ok: true,
    value: {
      businessDays,
      weekendDays: calendarDays - businessDays,
      calendarDays,
      reversed,
      earlier: iso(first),
      later: iso(last),
    },
  };
}
