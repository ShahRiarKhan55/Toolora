import { describe, expect, it } from 'vitest';
import { calculateGpa, validateCourse } from './logic';
import type { CourseInput } from './logic';

function course(overrides: Partial<CourseInput> = {}): CourseInput {
  return { id: '1', name: 'Course', credits: '3', grade: 'A', ...overrides };
}

describe('validateCourse', () => {
  it('accepts a valid course', () => {
    expect(validateCourse(course())).toBeUndefined();
  });

  it('rejects a blank credits value', () => {
    expect(validateCourse(course({ credits: '' }))).toBe('invalid-credits');
  });

  it('rejects a non-numeric credits value', () => {
    expect(validateCourse(course({ credits: 'abc' }))).toBe('invalid-credits');
  });

  it('rejects negative credits', () => {
    expect(validateCourse(course({ credits: '-1' }))).toBe('negative-credits');
  });

  it('accepts zero credits (e.g. a pass/fail audit)', () => {
    expect(validateCourse(course({ credits: '0' }))).toBeUndefined();
  });

  it('rejects a grade not in the scale', () => {
    expect(validateCourse(course({ grade: 'Z' }))).toBe('unknown-grade');
  });
});

describe('calculateGpa', () => {
  it('calculates a simple weighted GPA', () => {
    const result = calculateGpa([
      course({ id: '1', credits: '3', grade: 'A' }),
      course({ id: '2', credits: '3', grade: 'B' }),
    ]);
    // (3*4.0 + 3*3.0) / 6 = 3.5
    expect(result).toEqual({ ok: true, value: { gpa: 3.5, totalCredits: 6, courseCount: 2 } });
  });

  it('weights courses with different credit loads correctly', () => {
    const result = calculateGpa([
      course({ id: '1', credits: '4', grade: 'A' }),
      course({ id: '2', credits: '1', grade: 'F' }),
    ]);
    // (4*4.0 + 1*0.0) / 5 = 3.2
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.gpa).toBeCloseTo(3.2);
  });

  it('handles a single course', () => {
    const result = calculateGpa([course({ credits: '3', grade: 'B+' })]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.gpa).toBeCloseTo(3.3);
  });

  it('rejects an empty course list', () => {
    expect(calculateGpa([])).toEqual({ ok: false, error: 'no-courses', issues: {} });
  });

  it('rejects when any course is invalid, naming it in issues', () => {
    const result = calculateGpa([
      course({ id: '1', credits: '3', grade: 'A' }),
      course({ id: '2', credits: 'x', grade: 'B' }),
    ]);
    expect(result).toEqual({
      ok: false,
      error: 'invalid-courses',
      issues: { '2': 'invalid-credits' },
    });
  });

  it('rejects when total credits are zero', () => {
    const result = calculateGpa([
      course({ id: '1', credits: '0', grade: 'A' }),
      course({ id: '2', credits: '0', grade: 'F' }),
    ]);
    expect(result).toEqual({ ok: false, error: 'zero-total-credits', issues: {} });
  });

  it('accepts a custom grade scale', () => {
    const scale = [
      { grade: 'Pass', points: 4 },
      { grade: 'Fail', points: 0 },
    ];
    const result = calculateGpa([course({ credits: '3', grade: 'Pass' })], scale);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.gpa).toBe(4);
  });
});
