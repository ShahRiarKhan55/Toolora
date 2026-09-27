import { parseDecimal } from '../../lib/parseDecimal';

export interface GradeBand {
  /** Inclusive minimum percentage for this grade. */
  min: number;
  grade: string;
}

// A common default scale. Configurable via the optional `bands` parameter on gradeFromPercentage —
// not tied to any one institution's grading policy.
export const DEFAULT_GRADE_BANDS: readonly GradeBand[] = [
  { min: 90, grade: 'A' },
  { min: 80, grade: 'B' },
  { min: 70, grade: 'C' },
  { min: 60, grade: 'D' },
  { min: 0, grade: 'F' },
];

export type PercentageFromMarksError =
  'invalid-obtained' | 'invalid-total' | 'negative-obtained' | 'negative-total' | 'zero-total';

export type PercentageFromMarksOutcome =
  { ok: true; value: { percentage: number } } | { ok: false; error: PercentageFromMarksError };

/** Percentage obtained: `obtained / total * 100`. Allows obtained > total (e.g. extra credit). */
export function percentageFromMarks(
  obtainedInput: string,
  totalInput: string,
): PercentageFromMarksOutcome {
  const obtained = parseDecimal(obtainedInput);
  if (obtained === undefined) return { ok: false, error: 'invalid-obtained' };
  if (obtained < 0) return { ok: false, error: 'negative-obtained' };

  const total = parseDecimal(totalInput);
  if (total === undefined) return { ok: false, error: 'invalid-total' };
  if (total < 0) return { ok: false, error: 'negative-total' };
  if (total === 0) return { ok: false, error: 'zero-total' };

  return { ok: true, value: { percentage: (obtained / total) * 100 } };
}

export type MarksFromPercentageError =
  'invalid-percentage' | 'invalid-total' | 'negative-percentage' | 'negative-total' | 'zero-total';

export type MarksFromPercentageOutcome =
  { ok: true; value: { obtained: number } } | { ok: false; error: MarksFromPercentageError };

/** Marks obtained: `percentage / 100 * total`. */
export function marksFromPercentage(
  percentageInput: string,
  totalInput: string,
): MarksFromPercentageOutcome {
  const percentage = parseDecimal(percentageInput);
  if (percentage === undefined) return { ok: false, error: 'invalid-percentage' };
  if (percentage < 0) return { ok: false, error: 'negative-percentage' };

  const total = parseDecimal(totalInput);
  if (total === undefined) return { ok: false, error: 'invalid-total' };
  if (total < 0) return { ok: false, error: 'negative-total' };
  if (total === 0) return { ok: false, error: 'zero-total' };

  return { ok: true, value: { obtained: (percentage / 100) * total } };
}

export type PercentageChangeError = 'invalid-from' | 'invalid-to' | 'zero-from';

export type PercentageChangeOutcome =
  { ok: true; value: { change: number } } | { ok: false; error: PercentageChangeError };

/** Percentage change from one value to another: `(to - from) / |from| * 100`. */
export function percentageChange(fromInput: string, toInput: string): PercentageChangeOutcome {
  const from = parseDecimal(fromInput);
  if (from === undefined) return { ok: false, error: 'invalid-from' };

  const to = parseDecimal(toInput);
  if (to === undefined) return { ok: false, error: 'invalid-to' };

  if (from === 0) return { ok: false, error: 'zero-from' };

  return { ok: true, value: { change: ((to - from) / Math.abs(from)) * 100 } };
}

/** Looks up the grade for a percentage using the given bands (defaults to `DEFAULT_GRADE_BANDS`). */
export function gradeFromPercentage(
  percentage: number,
  bands: readonly GradeBand[] = DEFAULT_GRADE_BANDS,
): string {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  const match = sorted.find((band) => percentage >= band.min);
  return (match ?? sorted[sorted.length - 1])!.grade;
}

export const PERCENTAGE_FROM_MARKS_ERROR_MESSAGES: Record<PercentageFromMarksError, string> = {
  'invalid-obtained': 'Enter a valid number of marks obtained.',
  'invalid-total': 'Enter a valid total number of marks.',
  'negative-obtained': 'Marks obtained cannot be negative.',
  'negative-total': 'The total cannot be negative.',
  'zero-total': 'The total cannot be zero.',
};

export const MARKS_FROM_PERCENTAGE_ERROR_MESSAGES: Record<MarksFromPercentageError, string> = {
  'invalid-percentage': 'Enter a valid percentage.',
  'invalid-total': 'Enter a valid total number of marks.',
  'negative-percentage': 'Percentage cannot be negative.',
  'negative-total': 'The total cannot be negative.',
  'zero-total': 'The total cannot be zero.',
};

export const PERCENTAGE_CHANGE_ERROR_MESSAGES: Record<PercentageChangeError, string> = {
  'invalid-from': 'Enter a valid starting value.',
  'invalid-to': 'Enter a valid ending value.',
  'zero-from': 'The starting value cannot be zero.',
};
