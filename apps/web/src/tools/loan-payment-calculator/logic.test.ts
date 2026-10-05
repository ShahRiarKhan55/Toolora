import { describe, expect, it } from 'vitest';
import { calculateLoan } from './logic';
import type { LoanInput } from './logic';

const base: LoanInput = {
  amount: '200000',
  ratePercent: '6',
  term: '30',
  termUnit: 'years',
  frequency: 'monthly',
};

function run(overrides: Partial<LoanInput> = {}) {
  return calculateLoan({ ...base, ...overrides });
}

function value(overrides: Partial<LoanInput> = {}) {
  const result = run(overrides);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('calculateLoan', () => {
  it('matches the standard 30-year monthly example (200,000 at 6%)', () => {
    const v = value();
    expect(v.payment).toBeCloseTo(1199.1011, 3);
    expect(v.paymentCount).toBe(360);
    expect(v.totalPaid).toBeCloseTo(431676.38, 1);
    expect(v.totalInterest).toBeCloseTo(231676.38, 1);
  });

  it('splits a short loan correctly (12,000 at 12% over 1 year)', () => {
    const v = value({ amount: '12000', ratePercent: '12', term: '1' });
    expect(v.payment).toBeCloseTo(1066.19, 2);
    expect(v.totalInterest).toBeCloseTo(794.23, 2);
  });

  it('divides evenly at 0% interest', () => {
    const v = value({ amount: '12000', ratePercent: '0', term: '2' });
    expect(v.payment).toBe(500);
    expect(v.paymentCount).toBe(24);
    expect(v.totalInterest).toBeCloseTo(0, 8);
    expect(v.years.every((y) => y.interest === 0)).toBe(true);
  });

  it('supports biweekly and weekly payment counts', () => {
    const biweekly = value({ frequency: 'biweekly', term: '10' });
    expect(biweekly.paymentCount).toBe(260);
    const weekly = value({ frequency: 'weekly', term: '10' });
    expect(weekly.paymentCount).toBe(520);
    // The same loan paid more often has a smaller payment each time.
    expect(weekly.payment).toBeLessThan(biweekly.payment);
    expect(biweekly.payment).toBeLessThan(value({ term: '10' }).payment);
  });

  it('accepts a term in months', () => {
    expect(value({ term: '18', termUnit: 'months' }).paymentCount).toBe(18);
    expect(value({ term: '18', termUnit: 'months', frequency: 'weekly' }).paymentCount).toBe(78);
  });

  it('builds a yearly summary that ends at a zero balance and adds up', () => {
    const v = value({ term: '2.5' });
    expect(v.years.map((y) => y.year)).toEqual([1, 2, 3]);
    expect(v.years.at(-1)!.balance).toBe(0);
    const interest = v.years.reduce((sum, y) => sum + y.interest, 0);
    const principal = v.years.reduce((sum, y) => sum + y.principal, 0);
    expect(interest).toBeCloseTo(v.totalInterest, 4);
    expect(principal).toBeCloseTo(200000, 4);
    expect(v.years[0]!.balance).toBeGreaterThan(v.years[1]!.balance);
  });

  it('always returns finite numbers for extreme but allowed input', () => {
    const v = value({ amount: '1e12', ratePercent: '100', term: '100', frequency: 'weekly' });
    for (const n of [v.payment, v.totalPaid, v.totalInterest])
      expect(Number.isFinite(n)).toBe(true);
  });

  it.each(['', '0', '-1', 'abc'])('rejects amount %j', (amount) => {
    expect(run({ amount })).toEqual({ ok: false, error: 'invalid-amount' });
  });

  it('rejects too large an amount, a bad rate and a bad term', () => {
    expect(run({ amount: '1e13' })).toEqual({ ok: false, error: 'amount-too-large' });
    expect(run({ ratePercent: '-1' })).toEqual({ ok: false, error: 'invalid-rate' });
    expect(run({ ratePercent: '101' })).toEqual({ ok: false, error: 'invalid-rate' });
    expect(run({ ratePercent: '' })).toEqual({ ok: false, error: 'invalid-rate' });
    expect(run({ term: '0' })).toEqual({ ok: false, error: 'invalid-term' });
    expect(run({ term: '101' })).toEqual({ ok: false, error: 'term-too-long' });
    expect(run({ term: '1201', termUnit: 'months' })).toEqual({
      ok: false,
      error: 'term-too-long',
    });
    expect(run({ term: '0.01' })).toEqual({ ok: false, error: 'term-too-short' });
  });
});
