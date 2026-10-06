import { describe, expect, it } from 'vitest';
import { DEFAULT_TAKE_HOME_INPUT, estimateTakeHome, formatYen, summarize } from './logic';
import type { TakeHomeInput } from './logic';

function input(overrides: Partial<TakeHomeInput> = {}): TakeHomeInput {
  return { ...DEFAULT_TAKE_HOME_INPUT, salary: '300000', ...overrides };
}

function ok(overrides: Partial<TakeHomeInput> = {}) {
  const outcome = estimateTakeHome(input(overrides));
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
}

describe('estimateTakeHome', () => {
  it('estimates ¥300,000 a month for a 30-year-old in Tokyo (hand-derived)', () => {
    // standard remuneration 300,000: health 300,000 × 10.08% ÷ 2 = 15,120; pension 27,450; employment 1,500.
    const r = ok();
    expect(r.annualSalary).toBe(3_600_000);
    expect(r.socialInsurance.healthMonthly).toBe(15_120);
    expect(r.socialInsurance.pensionMonthly).toBe(27_450);
    expect(r.socialInsurance.employmentMonthly).toBe(1_500);
    // social insurance 44,070 × 12 = 528,840; employment income 3,600,000 → 2,440,000.
    // income tax: 2,440,000 − 528,840 − 1,040,000 = 871,160 → 871,000 × 5% = 43,550 × 102.1% = 44,464.55 → 44,400.
    expect(r.incomeTaxAnnual).toBe(44_400);
    // resident: 2,440,000 − 528,840 − 430,000 = 1,481,160 → 1,481,000; levy 148,100 − 2,500 = 145,600; + 5,000.
    expect(r.residentTaxAnnual).toBe(150_600);
    expect(r.takeHomeAnnual).toBe(3_600_000 - 528_840 - 44_400 - 150_600);
  });

  it('treats a monthly and the equivalent annual salary identically', () => {
    expect(estimateTakeHome(input({ salary: '300000', basis: 'monthly' }))).toEqual(
      estimateTakeHome(input({ salary: '3600000', basis: 'annual' })),
    );
  });

  it('accepts commas and a yen sign', () => {
    expect(estimateTakeHome(input({ salary: '¥300,000' }))).toEqual(estimateTakeHome(input()));
  });

  it('reports each kind of invalid input specifically', () => {
    const error = (overrides: Partial<TakeHomeInput>) => {
      const outcome = estimateTakeHome(input(overrides));
      return outcome.ok ? 'ok' : outcome.error;
    };
    expect(error({ salary: '' })).toBe('salary-empty');
    expect(error({ salary: '   ' })).toBe('salary-empty');
    expect(error({ salary: 'abc' })).toBe('salary-invalid');
    expect(error({ salary: '-1' })).toBe('salary-invalid');
    expect(error({ salary: '1.5' })).toBe('salary-invalid');
    expect(error({ salary: '90000000', basis: 'monthly' })).toBe('salary-too-large');
    expect(error({ age: '' })).toBe('age-empty');
    expect(error({ age: 'x' })).toBe('age-invalid');
    expect(error({ age: '17' })).toBe('age-invalid');
    expect(error({ age: '65' })).toBe('age-invalid');
    expect(error({ prefectureId: 'nowhere' })).toBe('prefecture-unknown');
    expect(error({ salary: '0' })).toBe('insurance-exceeds-pay');
    expect(error({ salary: '0', socialInsurance: false, employmentInsurance: false })).toBe('ok');
  });

  it('handles the boundary where age 40 adds care insurance', () => {
    const at39 = ok({ age: '39' });
    const at40 = ok({ age: '40' });
    expect(at40.socialInsurance.healthMonthly).toBeGreaterThan(at39.socialInsurance.healthMonthly);
    expect(at40.takeHomeAnnual).toBeLessThan(at39.takeHomeAnnual);
  });

  it('pays no income tax or resident tax on a low salary with insurance off', () => {
    const r = ok({ salary: '99000', socialInsurance: false, employmentInsurance: false });
    expect(r.annualSalary).toBe(1_188_000);
    expect(r.incomeTaxAnnual).toBe(0);
    expect(r.residentTaxAnnual).toBe(0);
    expect(r.takeHomeAnnual).toBe(1_188_000);
  });

  it('handles a large but valid salary', () => {
    const r = ok({ salary: '50000000', basis: 'annual' });
    expect(r.taxes.incomeTax.ratePercent).toBe(45);
    expect(r.takeHomeAnnual).toBeGreaterThan(20_000_000);
  });

  it('labels the result with its rules year and summarises it', () => {
    const r = ok();
    expect(r.ruleYearLabel).toBe('2026 (令和8年)');
    const text = summarize(r);
    expect(text).toContain('2026 (令和8年)');
    expect(text).toContain(formatYen(r.monthly.takeHome));
    expect(text).toContain('not an official calculation');
    expect(text).toContain('Resident tax is a steady-state estimate');
  });
});
