import { describe, expect, it } from 'vitest';
import { countBusinessDays } from './logic';

const both = { includeStart: true, includeEnd: true };

function count(start: string, end: string, options = both) {
  const result = countBusinessDays(start, end, options);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('countBusinessDays', () => {
  it('counts a Monday–Friday week (both ends included)', () => {
    expect(count('2024-03-04', '2024-03-08')).toMatchObject({
      businessDays: 5,
      calendarDays: 5,
      weekendDays: 0,
    });
  });

  it('counts a full calendar week as 5 business days and 2 weekend days', () => {
    expect(count('2024-03-04', '2024-03-10')).toMatchObject({
      businessDays: 5,
      weekendDays: 2,
      calendarDays: 7,
    });
  });

  it('gives 0 business days for a weekend-only range', () => {
    expect(count('2024-03-09', '2024-03-10')).toMatchObject({ businessDays: 0, calendarDays: 2 });
  });

  it('handles the same date by the include flags', () => {
    expect(count('2024-03-04', '2024-03-04')).toMatchObject({ businessDays: 1, calendarDays: 1 });
    expect(count('2024-03-09', '2024-03-09')).toMatchObject({ businessDays: 0, calendarDays: 1 });
    expect(
      count('2024-03-04', '2024-03-04', { includeStart: false, includeEnd: true }),
    ).toMatchObject({ businessDays: 0, calendarDays: 0 });
    expect(
      count('2024-03-04', '2024-03-04', { includeStart: true, includeEnd: false }),
    ).toMatchObject({ businessDays: 0, calendarDays: 0 });
  });

  it('excludes the start and/or end when asked', () => {
    // Mon 4 → Fri 8
    expect(
      count('2024-03-04', '2024-03-08', { includeStart: false, includeEnd: true }).businessDays,
    ).toBe(4);
    expect(
      count('2024-03-04', '2024-03-08', { includeStart: true, includeEnd: false }).businessDays,
    ).toBe(4);
    expect(
      count('2024-03-04', '2024-03-08', { includeStart: false, includeEnd: false }).businessDays,
    ).toBe(3);
  });

  it('swaps reversed dates and says so', () => {
    const result = count('2024-03-08', '2024-03-04');
    expect(result).toMatchObject({
      businessDays: 5,
      reversed: true,
      earlier: '2024-03-04',
      later: '2024-03-08',
    });
    expect(count('2024-03-04', '2024-03-08').reversed).toBe(false);
  });

  it('is exact across a leap day', () => {
    // Wed 28 Feb → Fri 1 Mar 2024 (leap year): Wed, Thu, Fri(29th), Fri? 28 Wed, 29 Thu, 1 Fri
    expect(count('2024-02-28', '2024-03-01')).toMatchObject({ businessDays: 3, calendarDays: 3 });
    // Same dates in a non-leap year skip the 29th: Tue 28 Feb → Wed 1 Mar 2023
    expect(count('2023-02-28', '2023-03-01')).toMatchObject({ businessDays: 2, calendarDays: 2 });
  });

  it('is exact across month and year boundaries', () => {
    // Fri 29 Dec 2023 → Tue 2 Jan 2024: Fri, Sat, Sun, Mon, Tue
    expect(count('2023-12-29', '2024-01-02')).toMatchObject({
      businessDays: 3,
      weekendDays: 2,
      calendarDays: 5,
    });
  });

  it('counts a whole leap year', () => {
    expect(count('2024-01-01', '2024-12-31')).toMatchObject({
      calendarDays: 366,
      businessDays: 262,
    });
  });

  it('validates input', () => {
    expect(countBusinessDays('', '2024-01-01', both)).toEqual({
      ok: false,
      error: 'missing-start',
    });
    expect(countBusinessDays('2024-01-01', '', both)).toEqual({ ok: false, error: 'missing-end' });
    expect(countBusinessDays('2024-02-30', '2024-03-01', both)).toEqual({
      ok: false,
      error: 'invalid-start',
    });
    expect(countBusinessDays('2024-02-01', 'nope', both)).toEqual({
      ok: false,
      error: 'invalid-end',
    });
  });
});
