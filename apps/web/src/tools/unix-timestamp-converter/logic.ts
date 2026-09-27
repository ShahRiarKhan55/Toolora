import { parseDecimal } from '../../lib/parseDecimal';

export type TimestampUnit = 'seconds' | 'milliseconds';

export type TimestampToDateError = 'invalid-timestamp' | 'out-of-range';

export interface TimestampToDateResult {
  epochMs: number;
  /** Full ISO 8601 in UTC, e.g. "2024-01-01T00:00:00.000Z" — the timezone-independent form. */
  utcIso: string;
}

export type TimestampToDateOutcome =
  { ok: true; value: TimestampToDateResult } | { ok: false; error: TimestampToDateError };

/** Converts a Unix timestamp (seconds or milliseconds, possibly negative or fractional) to a date. */
export function timestampToDate(input: string, unit: TimestampUnit): TimestampToDateOutcome {
  const value = parseDecimal(input);
  if (value === undefined) return { ok: false, error: 'invalid-timestamp' };

  const epochMs = unit === 'seconds' ? value * 1000 : value;
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return { ok: false, error: 'out-of-range' };

  return { ok: true, value: { epochMs, utcIso: date.toISOString() } };
}

export type DateToTimestampError = 'invalid-date';

export interface DateToTimestampResult {
  seconds: number;
  milliseconds: number;
}

export type DateToTimestampOutcome =
  { ok: true; value: DateToTimestampResult } | { ok: false; error: DateToTimestampError };

/**
 * Converts a `datetime-local`-shaped value ("YYYY-MM-DDTHH:mm[:ss]", no timezone) to Unix
 * timestamps, treating it as UTC — the UI labels this field "UTC" so there is no ambiguity.
 */
export function dateToTimestamp(dateTimeInput: string): DateToTimestampOutcome {
  const trimmed = dateTimeInput.trim();
  if (trimmed === '') return { ok: false, error: 'invalid-date' };

  const withZone = /Z|[+-]\d{2}:\d{2}$/.test(trimmed) ? trimmed : `${trimmed}Z`;
  const epochMs = new Date(withZone).getTime();
  if (Number.isNaN(epochMs)) return { ok: false, error: 'invalid-date' };

  return { ok: true, value: { seconds: Math.round(epochMs / 1000), milliseconds: epochMs } };
}

export const TIMESTAMP_TO_DATE_ERROR_MESSAGES: Record<TimestampToDateError, string> = {
  'invalid-timestamp': 'Enter a valid number for the timestamp.',
  'out-of-range': 'That timestamp is outside the range JavaScript dates can represent.',
};

export const DATE_TO_TIMESTAMP_ERROR_MESSAGES: Record<DateToTimestampError, string> = {
  'invalid-date': 'Enter a valid date and time.',
};
