import { describe, expect, it } from 'vitest';
import { calculateCompoundInterest } from './logic';
import type { CompoundInterestInput } from './logic';

const base: CompoundInterestInput = {
  principal: '1000',
  ratePercent: '5',
  compounding: 'yearly',
  time: '10',
  timeUnit: 'years',
};

function run(overrides: Partial<CompoundInterestInput> = {}) {
  return calculateCompoundInterest({ ...base, ...overrides });
}

function value(overrides: Partial<CompoundInterestInput> = {}) {
  const result = run(overrides);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('calculateCompoundInterest', () => {
  it('compounds annually: 1000 at 5% for 10 years', () => {
    const v = value();
    expect(v.finalAmount).toBeCloseTo(1628.894627, 5);
    expect(v.totalInterest).toBeCloseTo(628.894627, 5);
    expect(v.principal).toBe(1000);
  });

  it('compounds monthly: 1000 at 5% for 10 years', () => {
    expect(value({ compounding: 'monthly' }).finalAmount).toBeCloseTo(1647.0095, 4);
  });

  it('compounds half-yearly, quarterly and daily', () => {
    expect(value({ compounding: 'half-yearly' }).finalAmount).toBeCloseTo(1638.61644, 4);
    expect(value({ compounding: 'quarterly' }).finalAmount).toBeCloseTo(1643.61942, 4);
    expect(value({ compounding: 'daily' }).finalAmount).toBeCloseTo(1648.66, 1);
  });

  it('returns the principal unchanged at a 0% rate', () => {
    const v = value({ ratePercent: '0' });
    expect(v.finalAmount).toBe(1000);
    expect(v.totalInterest).toBe(0);
  });

  it('handles fractional years and months', () => {
    expect(value({ time: '0.5', compounding: 'yearly' }).finalAmount).toBeCloseTo(
      1000 * Math.pow(1.05, 0.5),
      8,
    );
    expect(value({ time: '18', timeUnit: 'months' }).finalAmount).toBeCloseTo(
      1000 * Math.pow(1.05, 1.5),
      8,
    );
    expect(value({ time: '12', timeUnit: 'months' }).finalAmount).toBeCloseTo(1050, 8);
  });

  it('accepts surrounding whitespace and decimals', () => {
    expect(value({ principal: ' 250.50 ', ratePercent: '2.5' }).principal).toBe(250.5);
  });

  it.each(['', '0', '-5', 'abc', 'Infinity'])('rejects principal %j', (principal) => {
    expect(run({ principal })).toEqual({ ok: false, error: 'invalid-principal' });
  });

  it('rejects a principal beyond the shared limit', () => {
    expect(run({ principal: '1e13' })).toEqual({ ok: false, error: 'principal-too-large' });
  });

  it.each(['', '-1', 'x', '100.1'])('rejects rate %j', (ratePercent) => {
    expect(run({ ratePercent })).toEqual({ ok: false, error: 'invalid-rate' });
  });

  it.each(['', '0', '-2', 'x'])('rejects time %j', (time) => {
    expect(run({ time })).toEqual({ ok: false, error: 'invalid-time' });
  });

  it('rejects a period over 100 years, including in months', () => {
    expect(run({ time: '101' })).toEqual({ ok: false, error: 'time-too-long' });
    expect(run({ time: '1201', timeUnit: 'months' })).toEqual({
      ok: false,
      error: 'time-too-long',
    });
  });
});
