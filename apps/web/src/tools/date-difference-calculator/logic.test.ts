import { describe, expect, it } from 'vitest';
import { calculateDateDifference } from './logic';

function diff(start: string, end: string) {
  const outcome = calculateDateDifference(start, end);
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
}

describe('calculateDateDifference', () => {
  it('returns zero for the same day', () => {
    expect(diff('2026-05-05', '2026-05-05')).toMatchObject({
      reversed: false,
      totalDays: 0,
      weeks: 0,
      extraDays: 0,
      years: 0,
      months: 0,
      days: 0,
    });
  });

  it('counts one day, not including the end date', () => {
    expect(diff('2026-01-01', '2026-01-02').totalDays).toBe(1);
  });

  it('splits days into weeks and days', () => {
    expect(diff('2026-01-01', '2026-01-16')).toMatchObject({
      totalDays: 15,
      weeks: 2,
      extraDays: 1,
    });
  });

  it('breaks down years, months and days', () => {
    expect(diff('2020-01-15', '2026-03-20')).toMatchObject({ years: 6, months: 2, days: 5 });
  });

  it('counts a full leap year as 366 days', () => {
    expect(diff('2024-01-01', '2025-01-01')).toMatchObject({
      totalDays: 366,
      years: 1,
      months: 0,
      days: 0,
    });
    expect(diff('2023-01-01', '2024-01-01').totalDays).toBe(365);
  });

  it('handles 29 February', () => {
    expect(diff('2024-02-28', '2024-03-01').totalDays).toBe(2);
    expect(diff('2023-02-28', '2023-03-01').totalDays).toBe(1);
    expect(diff('2024-02-29', '2025-02-28')).toMatchObject({
      totalDays: 365,
      years: 0,
      months: 11,
      days: 30,
    });
  });

  // Same convention as the age calculator: leftover days borrow the lengths of the months before the
  // later date, so 31 Jan to 1 Mar is 0 months + 29 days (Feb 28 + Jan 31 days minus 30).
  it('borrows past a short month (31 Jan to 1 Mar)', () => {
    expect(diff('2023-01-31', '2023-03-01')).toMatchObject({
      totalDays: 29,
      years: 0,
      months: 0,
      days: 29,
    });
  });

  it('handles year boundaries', () => {
    expect(diff('2025-12-31', '2026-01-01')).toMatchObject({
      totalDays: 1,
      years: 0,
      months: 0,
      days: 1,
    });
  });

  it('swaps reversed dates and flags it', () => {
    const value = diff('2026-03-20', '2020-01-15');
    expect(value).toMatchObject({
      reversed: true,
      earlier: '2020-01-15',
      later: '2026-03-20',
      years: 6,
    });
    expect(value.totalDays).toBe(diff('2020-01-15', '2026-03-20').totalDays);
  });

  it('is unaffected by daylight-saving changes', () => {
    expect(diff('2026-03-07', '2026-03-09').totalDays).toBe(2);
    expect(diff('2026-10-31', '2026-11-02').totalDays).toBe(2);
  });

  it('rejects invalid dates, saying which one', () => {
    expect(calculateDateDifference('', '2026-01-01')).toEqual({
      ok: false,
      error: 'invalid-start-date',
    });
    expect(calculateDateDifference('2026-01-01', '2026-02-30')).toEqual({
      ok: false,
      error: 'invalid-end-date',
    });
    expect(calculateDateDifference('2023-02-29', '2026-01-01')).toEqual({
      ok: false,
      error: 'invalid-start-date',
    });
    expect(calculateDateDifference('01/02/2026', '2026-01-01')).toEqual({
      ok: false,
      error: 'invalid-start-date',
    });
  });
});
