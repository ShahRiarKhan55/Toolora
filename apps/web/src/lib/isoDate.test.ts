import { describe, expect, it } from 'vitest';
import {
  compareDates,
  daysInMonth,
  isLeapYear,
  parseIsoDate,
  toIsoString,
  toUtcDate,
} from './isoDate';

describe('parseIsoDate', () => {
  it('parses a valid date', () => {
    expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it('rejects an empty string', () => {
    expect(parseIsoDate('')).toBeUndefined();
  });

  it('rejects a malformed string', () => {
    expect(parseIsoDate('2024/02/29')).toBeUndefined();
  });

  it('rejects a calendar-invalid date (30 February)', () => {
    expect(parseIsoDate('2024-02-30')).toBeUndefined();
  });

  it('rejects 29 February on a non-leap year', () => {
    expect(parseIsoDate('2023-02-29')).toBeUndefined();
  });

  it('rejects an out-of-range month', () => {
    expect(parseIsoDate('2024-13-01')).toBeUndefined();
  });
});

describe('compareDates', () => {
  it('orders by year, then month, then day', () => {
    expect(
      compareDates({ year: 2024, month: 1, day: 1 }, { year: 2023, month: 12, day: 31 }),
    ).toBeGreaterThan(0);
    expect(compareDates({ year: 2024, month: 1, day: 1 }, { year: 2024, month: 1, day: 1 })).toBe(
      0,
    );
    expect(
      compareDates({ year: 2024, month: 1, day: 1 }, { year: 2024, month: 2, day: 1 }),
    ).toBeLessThan(0);
  });
});

describe('isLeapYear', () => {
  it('treats a year divisible by 4 as a leap year', () => {
    expect(isLeapYear(2024)).toBe(true);
  });

  it('treats a century not divisible by 400 as not a leap year', () => {
    expect(isLeapYear(1900)).toBe(false);
  });

  it('treats a century divisible by 400 as a leap year', () => {
    expect(isLeapYear(2000)).toBe(true);
  });

  it('treats a plain non-multiple-of-4 year as not a leap year', () => {
    expect(isLeapYear(2023)).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('gives February 29 days in a leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });

  it('gives February 28 days in a non-leap year', () => {
    expect(daysInMonth(2023, 2)).toBe(28);
  });

  it('gives April 30 days', () => {
    expect(daysInMonth(2024, 4)).toBe(30);
  });
});

describe('toUtcDate / toIsoString', () => {
  it('round-trips a date', () => {
    const date = { year: 2024, month: 3, day: 5 };
    expect(toIsoString(date)).toBe('2024-03-05');
    expect(toUtcDate(date).toISOString()).toBe('2024-03-05T00:00:00.000Z');
  });

  it('pads single-digit months and days', () => {
    expect(toIsoString({ year: 2024, month: 1, day: 9 })).toBe('2024-01-09');
  });
});
