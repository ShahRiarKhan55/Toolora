import { describe, expect, it } from 'vitest';
import { calculatePercentage, formatPercentNumber } from './logic';
import type { PercentInput } from './logic';

function value(input: PercentInput) {
  const outcome = calculatePercentage(input);
  if (!outcome.ok) throw new Error(`unexpected error ${outcome.error}`);
  return outcome.value;
}
const error = (input: PercentInput) => {
  const outcome = calculatePercentage(input);
  return outcome.ok ? null : outcome.error;
};

describe('what is X% of Y', () => {
  it('computes a plain percentage', () => {
    expect(value({ mode: 'of', x: '15', y: '80' })).toEqual({ value: 12, kind: 'amount' });
    expect(value({ mode: 'of', x: '100', y: '37' }).value).toBe(37);
  });

  it('handles decimals without floating-point noise', () => {
    expect(value({ mode: 'of', x: '0.1', y: '0.2' }).value).toBe(0.0002);
    expect(value({ mode: 'of', x: '7.5', y: '19.99' }).value).toBe(1.49925);
  });

  it('handles zero and negatives', () => {
    expect(value({ mode: 'of', x: '0', y: '500' }).value).toBe(0);
    expect(value({ mode: 'of', x: '25', y: '0' }).value).toBe(0);
    expect(value({ mode: 'of', x: '-10', y: '50' }).value).toBe(-5);
    expect(value({ mode: 'of', x: '10', y: '-50' }).value).toBe(-5);
  });

  it('allows percentages above 100', () => {
    expect(value({ mode: 'of', x: '250', y: '40' }).value).toBe(100);
  });
});

describe('X is what percent of Y', () => {
  it('computes the share', () => {
    expect(value({ mode: 'what-percent', x: '25', y: '200' })).toEqual({
      value: 12.5,
      kind: 'percent',
    });
    expect(value({ mode: 'what-percent', x: '1', y: '3' }).value).toBe(33.3333333333);
  });

  it('handles zero numerator, values above 100% and negatives', () => {
    expect(value({ mode: 'what-percent', x: '0', y: '9' }).value).toBe(0);
    expect(value({ mode: 'what-percent', x: '150', y: '100' }).value).toBe(150);
    expect(value({ mode: 'what-percent', x: '-5', y: '20' }).value).toBe(-25);
  });

  it('rejects division by zero', () => {
    expect(error({ mode: 'what-percent', x: '5', y: '0' })).toBe('zero-y');
    expect(error({ mode: 'what-percent', x: '0', y: '0' })).toBe('zero-y');
  });
});

describe('percentage change', () => {
  it('reports increases and decreases', () => {
    expect(value({ mode: 'change', x: '50', y: '75' })).toEqual({
      value: 50,
      kind: 'percent',
      trend: 'increase',
    });
    expect(value({ mode: 'change', x: '200', y: '150' })).toEqual({
      value: -25,
      kind: 'percent',
      trend: 'decrease',
    });
  });

  it('reports no change', () => {
    expect(value({ mode: 'change', x: '40', y: '40' })).toEqual({
      value: 0,
      kind: 'percent',
      trend: 'none',
    });
  });

  it('handles decimals and a drop to zero', () => {
    expect(value({ mode: 'change', x: '1.5', y: '1.8' }).value).toBe(20);
    expect(value({ mode: 'change', x: '80', y: '0' }).value).toBe(-100);
  });

  it('measures against the absolute start value when it is negative', () => {
    expect(value({ mode: 'change', x: '-50', y: '-25' })).toMatchObject({
      value: 50,
      trend: 'increase',
    });
  });

  it('rejects a change from zero', () => {
    expect(error({ mode: 'change', x: '0', y: '10' })).toBe('zero-x');
  });
});

describe('increase or decrease by a percentage', () => {
  it('increases and decreases', () => {
    expect(value({ mode: 'adjust', x: '200', y: '10', direction: 'increase' }).value).toBe(220);
    expect(value({ mode: 'adjust', x: '200', y: '10', direction: 'decrease' }).value).toBe(180);
  });

  it('defaults to an increase and handles 0%, 100% and decimals', () => {
    expect(value({ mode: 'adjust', x: '200', y: '10' }).value).toBe(220);
    expect(value({ mode: 'adjust', x: '200', y: '0' }).value).toBe(200);
    expect(value({ mode: 'adjust', x: '200', y: '100', direction: 'decrease' }).value).toBe(0);
    expect(value({ mode: 'adjust', x: '19.99', y: '7.5', direction: 'increase' }).value).toBe(
      21.48925,
    );
  });

  it('does not show negative zero', () => {
    expect(
      Object.is(value({ mode: 'adjust', x: '0', y: '50', direction: 'decrease' }).value, 0),
    ).toBe(true);
  });
});

describe('invalid input', () => {
  it('flags blank and non-numeric fields', () => {
    expect(error({ mode: 'of', x: '', y: '5' })).toBe('invalid-x');
    expect(error({ mode: 'of', x: '5', y: '' })).toBe('invalid-y');
    expect(error({ mode: 'of', x: 'abc', y: '5' })).toBe('invalid-x');
    expect(error({ mode: 'of', x: '5', y: 'NaN' })).toBe('invalid-y');
    expect(error({ mode: 'of', x: 'Infinity', y: '5' })).toBe('invalid-x');
  });

  it('flags results that overflow', () => {
    expect(error({ mode: 'of', x: '1e308', y: '1e308' })).toBe('too-large');
  });
});

describe('formatPercentNumber', () => {
  it('groups digits and caps decimals', () => {
    expect(formatPercentNumber(1234567.891)).toBe('1,234,567.891');
    expect(formatPercentNumber(33.3333333333)).toBe('33.333333');
    expect(formatPercentNumber(0)).toBe('0');
  });
});
