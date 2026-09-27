import { compareDates, parseIsoDate } from '../../lib/isoDate';

export type EraId = 'meiji' | 'taisho' | 'showa' | 'heisei' | 'reiwa';

export interface Era {
  id: EraId;
  name: string;
  /** Inclusive ISO start date. */
  start: string;
  /** Inclusive ISO end date, or `null` if the era is still ongoing. */
  end: string | null;
}

// Official Gregorian boundaries of each modern era. The era year increments on January 1st, not on
// the anniversary of the start date, so an era's first and last calendar years are short.
export const ERAS: readonly Era[] = [
  { id: 'meiji', name: 'Meiji', start: '1868-10-23', end: '1912-07-29' },
  { id: 'taisho', name: 'Taisho', start: '1912-07-30', end: '1926-12-24' },
  { id: 'showa', name: 'Showa', start: '1926-12-25', end: '1989-01-07' },
  { id: 'heisei', name: 'Heisei', start: '1989-01-08', end: '2019-04-30' },
  { id: 'reiwa', name: 'Reiwa', start: '2019-05-01', end: null },
];

export type GregorianToEraError = 'invalid-date' | 'before-supported-range';

export interface GregorianToEraResult {
  era: Era;
  eraYear: number;
}

export type GregorianToEraOutcome =
  { ok: true; value: GregorianToEraResult } | { ok: false; error: GregorianToEraError };

/** Converts a Gregorian date (`YYYY-MM-DD`) to its era and era year. */
export function gregorianToEra(dateInput: string): GregorianToEraOutcome {
  const parsed = parseIsoDate(dateInput);
  if (!parsed) return { ok: false, error: 'invalid-date' };

  const firstSupported = parseIsoDate(ERAS[0]!.start)!;
  if (compareDates(parsed, firstSupported) < 0)
    return { ok: false, error: 'before-supported-range' };

  for (const era of ERAS) {
    const start = parseIsoDate(era.start)!;
    const end = era.end ? parseIsoDate(era.end) : undefined;
    if (compareDates(parsed, start) >= 0 && (!end || compareDates(parsed, end) <= 0)) {
      return { ok: true, value: { era, eraYear: parsed.year - start.year + 1 } };
    }
  }

  // Unreachable: Reiwa has no end date, so every date from Meiji's start onward matches an era above.
  return { ok: false, error: 'before-supported-range' };
}

export type EraToGregorianError = 'unknown-era' | 'invalid-year' | 'year-out-of-range';

export interface EraToGregorianResult {
  era: Era;
  eraYear: number;
  gregorianYear: number;
  /** True for an era's first or last calendar year, which the era does not span in full. */
  isPartialYear: boolean;
}

export type EraToGregorianOutcome =
  { ok: true; value: EraToGregorianResult } | { ok: false; error: EraToGregorianError };

/** Converts an era + era year (e.g. Reiwa 6) to the Gregorian calendar year. */
export function eraToGregorian(eraId: string, eraYearInput: string): EraToGregorianOutcome {
  const era = ERAS.find((candidate) => candidate.id === eraId);
  if (!era) return { ok: false, error: 'unknown-era' };

  const trimmed = eraYearInput.trim();
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: 'invalid-year' };
  const eraYear = Number(trimmed);
  if (eraYear < 1) return { ok: false, error: 'invalid-year' };

  const start = parseIsoDate(era.start)!;
  const gregorianYear = start.year + eraYear - 1;

  if (era.end) {
    const end = parseIsoDate(era.end)!;
    const maxEraYear = end.year - start.year + 1;
    if (eraYear > maxEraYear) return { ok: false, error: 'year-out-of-range' };
  }

  const isPartialYear =
    eraYear === 1 || gregorianYear === (era.end ? parseIsoDate(era.end)!.year : NaN);
  return { ok: true, value: { era, eraYear, gregorianYear, isPartialYear } };
}

export const GREGORIAN_TO_ERA_ERROR_MESSAGES: Record<GregorianToEraError, string> = {
  'invalid-date': 'Enter a valid date.',
  'before-supported-range': 'Toolora supports dates from Meiji 1 (23 October 1868) onward.',
};

export const ERA_TO_GREGORIAN_ERROR_MESSAGES: Record<EraToGregorianError, string> = {
  'unknown-era': 'Choose a supported era.',
  'invalid-year': 'Enter a whole number of 1 or more for the era year.',
  'year-out-of-range': 'That era did not last that many years.',
};
