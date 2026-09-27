import type { CalendarDate } from '../../lib/isoDate';
import {
  compareDates,
  daysInMonth,
  isLeapYear,
  parseIsoDate,
  toIsoString,
  toUtcDate,
} from '../../lib/isoDate';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type AgeError = 'invalid-birth-date' | 'invalid-reference-date' | 'birth-date-in-future';

export interface NextBirthday {
  /** The observed date (29 Feb birthdays fall back to 28 Feb in a non-leap year). */
  date: string;
  daysUntil: number;
  /** The age the person will turn on that date. */
  turningAge: number;
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  nextBirthday: NextBirthday;
}

export type AgeOutcome = { ok: true; value: AgeResult } | { ok: false; error: AgeError };

/** The birthday to observe in a given year, moving 29 Feb to 28 Feb outside leap years. */
function birthdayInYear(birth: CalendarDate, year: number): CalendarDate {
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(year)) {
    return { year, month: 2, day: 28 };
  }
  return { year, month: birth.month, day: birth.day };
}

/**
 * Calculates age in full years, months and days between a birth date and a reference date
 * (defaulting to today is the caller's responsibility — this function is pure and deterministic).
 */
export function calculateAge(birthDateInput: string, referenceDateInput: string): AgeOutcome {
  const birth = parseIsoDate(birthDateInput);
  if (!birth) return { ok: false, error: 'invalid-birth-date' };

  const reference = parseIsoDate(referenceDateInput);
  if (!reference) return { ok: false, error: 'invalid-reference-date' };

  if (compareDates(birth, reference) > 0) return { ok: false, error: 'birth-date-in-future' };

  let years = reference.year - birth.year;
  let months = reference.month - birth.month;
  let days = reference.day - birth.day;

  // Borrow a month at a time (not just once): a birth day of 29–31 can be short by more days than
  // even the single preceding month has (e.g. 31 Jan to 1 Mar borrows past a 29-day February too).
  let borrowMonth = reference.month;
  let borrowYear = reference.year;
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

  const totalDays = Math.round(
    (toUtcDate(reference).getTime() - toUtcDate(birth).getTime()) / MS_PER_DAY,
  );

  let candidate = birthdayInYear(birth, reference.year);
  if (compareDates(candidate, reference) < 0) {
    candidate = birthdayInYear(birth, reference.year + 1);
  }
  const daysUntil = Math.round(
    (toUtcDate(candidate).getTime() - toUtcDate(reference).getTime()) / MS_PER_DAY,
  );

  return {
    ok: true,
    value: {
      years,
      months,
      days,
      totalDays,
      nextBirthday: {
        date: toIsoString(candidate),
        daysUntil,
        turningAge: candidate.year - birth.year,
      },
    },
  };
}

export const AGE_CALCULATOR_ERROR_MESSAGES: Record<AgeError, string> = {
  'invalid-birth-date': 'Enter a valid date of birth.',
  'invalid-reference-date': 'Enter a valid reference date.',
  'birth-date-in-future': 'The date of birth cannot be after the reference date.',
};
