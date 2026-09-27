import { parseDecimal } from '../../lib/parseDecimal';

export interface GradeScaleEntry {
  grade: string;
  points: number;
}

// A standard, widely used 4.0 scale. Not every institution uses this scale — it is a sensible
// default, not a hard-coded assumption about any specific one (CLAUDE.md: "do not hard-code a
// single institution's grading system").
export const DEFAULT_GRADE_SCALE: readonly GradeScaleEntry[] = [
  { grade: 'A', points: 4.0 },
  { grade: 'A-', points: 3.7 },
  { grade: 'B+', points: 3.3 },
  { grade: 'B', points: 3.0 },
  { grade: 'B-', points: 2.7 },
  { grade: 'C+', points: 2.3 },
  { grade: 'C', points: 2.0 },
  { grade: 'C-', points: 1.7 },
  { grade: 'D+', points: 1.3 },
  { grade: 'D', points: 1.0 },
  { grade: 'F', points: 0.0 },
];

export interface CourseInput {
  id: string;
  name: string;
  credits: string;
  grade: string;
}

export type CourseError = 'invalid-credits' | 'negative-credits' | 'unknown-grade';

export type GpaError = 'no-courses' | 'invalid-courses' | 'zero-total-credits';

export interface GpaResult {
  gpa: number;
  totalCredits: number;
  courseCount: number;
}

export type GpaOutcome =
  | { ok: true; value: GpaResult }
  | { ok: false; error: GpaError; issues: Readonly<Record<string, CourseError>> };

export const COURSE_ERROR_MESSAGES: Record<CourseError, string> = {
  'invalid-credits': 'Enter a valid number of credits.',
  'negative-credits': 'Credits cannot be negative.',
  'unknown-grade': 'Choose a grade from the list.',
};

export const GPA_ERROR_MESSAGES: Record<GpaError, string> = {
  'no-courses': 'Add at least one course.',
  'invalid-courses': 'Fix the highlighted courses before calculating.',
  'zero-total-credits': 'Total credits cannot be zero.',
};

/** Validates a single course row; returns `undefined` when it is valid. */
export function validateCourse(
  course: CourseInput,
  scale: readonly GradeScaleEntry[] = DEFAULT_GRADE_SCALE,
): CourseError | undefined {
  const credits = parseDecimal(course.credits);
  if (credits === undefined) return 'invalid-credits';
  if (credits < 0) return 'negative-credits';
  if (!scale.some((entry) => entry.grade === course.grade)) return 'unknown-grade';
  return undefined;
}

/** Calculates a credit-weighted GPA. All courses must be valid, and total credits must be > 0. */
export function calculateGpa(
  courses: readonly CourseInput[],
  scale: readonly GradeScaleEntry[] = DEFAULT_GRADE_SCALE,
): GpaOutcome {
  if (courses.length === 0) return { ok: false, error: 'no-courses', issues: {} };

  const issues: Record<string, CourseError> = {};
  for (const course of courses) {
    const error = validateCourse(course, scale);
    if (error) issues[course.id] = error;
  }
  if (Object.keys(issues).length > 0) return { ok: false, error: 'invalid-courses', issues };

  let totalPoints = 0;
  let totalCredits = 0;
  for (const course of courses) {
    const credits = parseDecimal(course.credits)!;
    const points = scale.find((entry) => entry.grade === course.grade)!.points;
    totalPoints += credits * points;
    totalCredits += credits;
  }

  if (totalCredits === 0) return { ok: false, error: 'zero-total-credits', issues: {} };

  return {
    ok: true,
    value: { gpa: totalPoints / totalCredits, totalCredits, courseCount: courses.length },
  };
}
