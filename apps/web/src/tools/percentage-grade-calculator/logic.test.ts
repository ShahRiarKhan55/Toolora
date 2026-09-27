import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GRADE_BANDS,
  gradeFromPercentage,
  marksFromPercentage,
  percentageChange,
  percentageFromMarks,
} from './logic';

describe('percentageFromMarks', () => {
  it('calculates a normal percentage', () => {
    expect(percentageFromMarks('45', '50')).toEqual({ ok: true, value: { percentage: 90 } });
  });

  it('allows obtained marks above the total (extra credit)', () => {
    const result = percentageFromMarks('55', '50');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.percentage).toBeCloseTo(110);
  });

  it('allows zero marks obtained', () => {
    expect(percentageFromMarks('0', '50')).toEqual({ ok: true, value: { percentage: 0 } });
  });

  it('rejects a blank obtained value', () => {
    expect(percentageFromMarks('', '50')).toEqual({ ok: false, error: 'invalid-obtained' });
  });

  it('rejects a negative obtained value', () => {
    expect(percentageFromMarks('-1', '50')).toEqual({ ok: false, error: 'negative-obtained' });
  });

  it('rejects a non-numeric total', () => {
    expect(percentageFromMarks('45', 'abc')).toEqual({ ok: false, error: 'invalid-total' });
  });

  it('rejects a zero total', () => {
    expect(percentageFromMarks('45', '0')).toEqual({ ok: false, error: 'zero-total' });
  });

  it('rejects a negative total', () => {
    expect(percentageFromMarks('45', '-50')).toEqual({ ok: false, error: 'negative-total' });
  });
});

describe('marksFromPercentage', () => {
  it('calculates marks from a percentage', () => {
    expect(marksFromPercentage('90', '50')).toEqual({ ok: true, value: { obtained: 45 } });
  });

  it('rejects a blank percentage', () => {
    expect(marksFromPercentage('', '50')).toEqual({ ok: false, error: 'invalid-percentage' });
  });

  it('rejects a negative percentage', () => {
    expect(marksFromPercentage('-10', '50')).toEqual({ ok: false, error: 'negative-percentage' });
  });

  it('rejects a zero total', () => {
    expect(marksFromPercentage('90', '0')).toEqual({ ok: false, error: 'zero-total' });
  });
});

describe('percentageChange', () => {
  it('calculates a positive change', () => {
    expect(percentageChange('50', '75')).toEqual({ ok: true, value: { change: 50 } });
  });

  it('calculates a negative change', () => {
    expect(percentageChange('80', '60')).toEqual({ ok: true, value: { change: -25 } });
  });

  it('handles a negative starting value using its magnitude', () => {
    const result = percentageChange('-50', '-25');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.change).toBe(50);
  });

  it('rejects a zero starting value', () => {
    expect(percentageChange('0', '10')).toEqual({ ok: false, error: 'zero-from' });
  });

  it('rejects a non-numeric ending value', () => {
    expect(percentageChange('50', 'abc')).toEqual({ ok: false, error: 'invalid-to' });
  });

  it('gives zero change when the value is unchanged', () => {
    expect(percentageChange('50', '50')).toEqual({ ok: true, value: { change: 0 } });
  });
});

describe('gradeFromPercentage', () => {
  it('grades a top score as A', () => {
    expect(gradeFromPercentage(95)).toBe('A');
  });

  it('grades exactly on a boundary as the higher band (inclusive minimum)', () => {
    expect(gradeFromPercentage(90)).toBe('A');
    expect(gradeFromPercentage(89.99)).toBe('B');
  });

  it('grades zero as F', () => {
    expect(gradeFromPercentage(0)).toBe('F');
  });

  it('grades a percentage above 100 as the top band', () => {
    expect(gradeFromPercentage(120)).toBe('A');
  });

  it('grades a negative percentage as the bottom band', () => {
    expect(gradeFromPercentage(-10)).toBe('F');
  });

  it('accepts a custom grade scale', () => {
    const bands = [
      { min: 50, grade: 'Pass' },
      { min: 0, grade: 'Fail' },
    ];
    expect(gradeFromPercentage(60, bands)).toBe('Pass');
    expect(gradeFromPercentage(40, bands)).toBe('Fail');
  });

  it('covers every default band', () => {
    expect(DEFAULT_GRADE_BANDS.map((b) => b.grade)).toEqual(['A', 'B', 'C', 'D', 'F']);
  });
});
