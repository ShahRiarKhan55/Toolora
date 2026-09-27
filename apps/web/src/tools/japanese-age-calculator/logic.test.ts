import { describe, expect, it } from 'vitest';
import { daysInMonth, parseIsoDate, toUtcDate } from '../../lib/isoDate';
import { calculateAge } from './logic';

/**
 * Adds calendar years/months (clamping the day to the target month's length, e.g. 31 Jan + 1 month
 * = 28/29 Feb) then whole days, mirroring how a human reads "N years, M months, D days" — used to
 * check that the calculated y/m/d, added back to the birth date, reconstructs the reference date.
 */
function addToDate(iso: string, years: number, months: number, days: number): string {
  const birth = parseIsoDate(iso)!;
  const totalMonths = birth.year * 12 + (birth.month - 1) + years * 12 + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const day = Math.min(birth.day, daysInMonth(year, month));

  const date = toUtcDate({ year, month, day });
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('calculateAge', () => {
  it('gives zero years, months and days on the birth date itself', () => {
    const result = calculateAge('2000-01-01', '2000-01-01');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatchObject({ years: 0, months: 0, days: 0, totalDays: 0 });
    }
  });

  it('counts a whole number of years on an exact anniversary', () => {
    const result = calculateAge('1990-06-15', '2024-06-15');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toMatchObject({ years: 34, months: 0, days: 0 });
  });

  it('counts years, months and days that reconstruct the reference date exactly', () => {
    const cases: [string, string][] = [
      ['1990-08-20', '2024-06-15'],
      ['1985-01-31', '2024-03-01'],
      ['2023-12-31', '2024-01-01'],
      ['2000-02-29', '2021-06-01'],
      ['2000-02-29', '2024-02-29'],
    ];
    for (const [birth, reference] of cases) {
      const result = calculateAge(birth, reference);
      expect(result.ok, `${birth} -> ${reference}`).toBe(true);
      if (result.ok) {
        const { years, months, days } = result.value;
        expect(years).toBeGreaterThanOrEqual(0);
        expect(months).toBeGreaterThanOrEqual(0);
        expect(months).toBeLessThan(12);
        expect(days).toBeGreaterThanOrEqual(0);
        expect(addToDate(birth, years, months, days)).toBe(reference);
      }
    }
  });

  it('computes total days lived matching the calendar difference', () => {
    const result = calculateAge('2024-01-01', '2024-01-11');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.totalDays).toBe(10);
  });

  it('rejects an empty birth date', () => {
    expect(calculateAge('', '2024-01-01')).toEqual({ ok: false, error: 'invalid-birth-date' });
  });

  it('rejects a malformed birth date', () => {
    expect(calculateAge('not-a-date', '2024-01-01')).toEqual({
      ok: false,
      error: 'invalid-birth-date',
    });
  });

  it('rejects a calendar-invalid birth date', () => {
    expect(calculateAge('2024-02-30', '2024-06-01')).toEqual({
      ok: false,
      error: 'invalid-birth-date',
    });
  });

  it('rejects an empty reference date', () => {
    expect(calculateAge('2000-01-01', '')).toEqual({ ok: false, error: 'invalid-reference-date' });
  });

  it('rejects a birth date after the reference date', () => {
    expect(calculateAge('2030-01-01', '2024-01-01')).toEqual({
      ok: false,
      error: 'birth-date-in-future',
    });
  });

  describe('nextBirthday', () => {
    it('finds a birthday later in the same reference year', () => {
      const result = calculateAge('1990-08-20', '2024-06-15');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nextBirthday.date).toBe('2024-08-20');
        expect(result.value.nextBirthday.turningAge).toBe(34);
        expect(result.value.nextBirthday.daysUntil).toBeGreaterThan(0);
      }
    });

    it("rolls over to next year when this year's birthday has passed", () => {
      const result = calculateAge('1990-03-01', '2024-06-15');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nextBirthday.date).toBe('2025-03-01');
        expect(result.value.nextBirthday.turningAge).toBe(35);
      }
    });

    it('reports today as the next birthday, zero days away, when today is the birthday', () => {
      const result = calculateAge('1990-06-15', '2024-06-15');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.nextBirthday.date).toBe('2024-06-15');
        expect(result.value.nextBirthday.daysUntil).toBe(0);
      }
    });

    it('observes a 29 February birthday on 28 February in a non-leap year', () => {
      const result = calculateAge('2000-02-29', '2023-01-01');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.nextBirthday.date).toBe('2023-02-28');
    });

    it('observes a 29 February birthday on the real date in a leap year', () => {
      const result = calculateAge('2000-02-29', '2024-01-01');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.nextBirthday.date).toBe('2024-02-29');
    });
  });
});
