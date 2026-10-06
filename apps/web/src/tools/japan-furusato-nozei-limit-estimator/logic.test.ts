import { describe, expect, it } from 'vitest';
import { calculateSocialInsurance } from '../../lib/japanPayroll';
import {
  DEFAULT_FURUSATO_INPUT,
  donationLimit,
  estimateFurusatoLimit,
  specialDeductionBracketRate,
  summarize,
} from './logic';
import type { FurusatoInput, FurusatoResult } from './logic';

function estimate(overrides: Partial<FurusatoInput> = {}): FurusatoResult {
  const outcome = estimateFurusatoLimit({
    ...DEFAULT_FURUSATO_INPUT,
    salary: '5000000',
    ...overrides,
  });
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
}

/**
 * A from-scratch oracle in floating point, written the way the published formulas read, for salaries that
 * are multiples of ¥4,000 (so the statutory salary rounding does not matter). Social insurance comes from
 * the shared, separately tested module.
 */
function oracleLimit(
  salary: number,
  opts: { spouse?: boolean; general?: number; specific?: number } = {},
) {
  const general = opts.general ?? 0;
  const specific = opts.specific ?? 0;
  const deduction =
    salary <= 2_200_000
      ? 740_000
      : salary <= 3_600_000
        ? salary * 0.3 + 80_000
        : salary <= 6_600_000
          ? salary * 0.2 + 440_000
          : salary <= 8_500_000
            ? salary * 0.1 + 1_100_000
            : 1_950_000;
  const income = salary - deduction;
  const si = calculateSocialInsurance({
    annualSalary: salary,
    age: 30,
    prefectureId: 'tokyo',
    enrolled: true,
    employmentInsurance: true,
  }).total;
  const basicIncomeTax = income <= 4_890_000 ? 1_040_000 : income <= 6_550_000 ? 670_000 : 620_000;
  const itPersonal = (opts.spouse ? 380_000 : 0) + general * 380_000 + specific * 630_000;
  const resPersonal = (opts.spouse ? 330_000 : 0) + general * 330_000 + specific * 450_000;
  const diff = 50_000 + (opts.spouse ? 50_000 : 0) + general * 50_000 + specific * 180_000;

  const taxableRes = Math.floor(Math.max(0, income - si - 430_000 - resPersonal) / 1000) * 1000;
  const taxableIt =
    Math.floor(Math.max(0, income - si - basicIncomeTax - itPersonal) / 1000) * 1000;
  const credit =
    taxableRes <= 2_000_000
      ? Math.min(diff, taxableRes) * 0.05
      : Math.max(2_500, (diff - (taxableRes - 2_000_000)) * 0.05);
  const levy = taxableRes * 0.1 - credit;
  if (levy <= 0) return 0;
  const marginal = [
    [1_950_000, 0.05],
    [3_300_000, 0.1],
    [6_950_000, 0.2],
    [9_000_000, 0.23],
    [18_000_000, 0.33],
    [40_000_000, 0.4],
    [Infinity, 0.45],
  ] as const;
  // the income-tax taxable income should equal the resident one less the personal-deduction differences
  const reference = taxableIt;
  const rate = marginal.find(([upTo]) => reference <= upTo)![1];
  return Math.floor((levy * 0.2) / (0.9 - rate * 1.021)) + 2_000;
}

describe('estimateFurusatoLimit: hand-derived cases', () => {
  it('estimates ¥5,000,000 for a single 30-year-old in Tokyo', () => {
    // social insurance 723,144; employment income 3,560,000; income-tax taxable 1,796,000;
    // resident taxable 2,406,000 → levy 240,600 − 2,500 = 238,100; rate 5% → 90% − 5.105% = 84.895%
    // limit = 238,100 × 20% ÷ 84.895% + 2,000 = 58,092
    const r = estimate();
    expect(r.employmentIncome).toBe(3_560_000);
    expect(r.socialInsuranceAnnual).toBe(723_144);
    expect(r.incomeTaxableIncome).toBe(1_796_000);
    expect(r.residentTaxableIncome).toBe(2_406_000);
    expect(r.residentIncomeLevy).toBe(238_100);
    expect(r.referenceRatePercent).toBe(5);
    expect(r.specialDeductionRatePercent).toBeCloseTo(84.895, 6);
    expect(r.limit).toBe(58_092);
    expect(r.basis).toBe('special-deduction-cap');
    expect(r.ruleYearLabel).toBe('2026 (令和8年)');
  });

  it('estimates ¥8,000,000 at the 20% bracket (rate 69.58%)', () => {
    // social insurance 1,164,960; employment income 6,100,000; income-tax taxable 4,265,000; resident 4,505,000
    // levy 450,500 − 2,500 = 448,000; limit = 448,000 × 20% ÷ 69.58% + 2,000 = 130,772
    const r = estimate({ salary: '8000000' });
    expect(r.referenceRatePercent).toBe(20);
    expect(r.specialDeductionRatePercent).toBeCloseTo(69.58, 6);
    expect(r.residentIncomeLevy).toBe(448_000);
    expect(r.limit).toBe(130_772);
  });

  it('lowers the limit for a spouse with low income', () => {
    // extra deductions 380,000 / 330,000 → levy 207,600 − 2,500 = 205,100; limit = 205,100 × 20% ÷ 84.895% + 2,000 = 50,318
    const r = estimate({ spouse: 'deduction' });
    expect(r.residentIncomeLevy).toBe(205_100);
    expect(r.limit).toBe(50_318);
  });

  it('lowers the limit for a 19–22 dependant', () => {
    // ¥8M with one: levy 405,500 − 2,500 = 403,000; limit = 403,000 × 20% ÷ 69.58% + 2,000 = 117,837
    const r = estimate({ salary: '8000000', specificDependants: '1' });
    expect(r.residentIncomeLevy).toBe(403_000);
    expect(r.limit).toBe(117_837);
  });

  it('lowers the limit by other deductions', () => {
    const none = estimate();
    const some = estimate({ otherDeductions: '300000' });
    expect(some.limit).toBeLessThan(none.limit);
    expect(some.residentTaxableIncome).toBe(none.residentTaxableIncome - 300_000);
  });
});

describe('estimateFurusatoLimit: against the independent oracle', () => {
  it('agrees within ¥1 for single people across the income range', () => {
    // up to ¥23M so the income stays inside the 620,000 basic-deduction band the oracle assumes
    for (let salary = 2_000_000; salary <= 23_000_000; salary += 996_000) {
      const expected = oracleLimit(salary);
      const actual = estimate({ salary: String(salary) }).limit;
      expect(Math.abs(actual - expected), String(salary)).toBeLessThanOrEqual(1);
    }
  });

  it('agrees for households', () => {
    for (const salary of [4_000_000, 6_000_000, 9_000_000]) {
      const cases = [
        [{ spouse: 'deduction' as const }, { spouse: true }],
        [{ generalDependants: '2' }, { general: 2 }],
        [{ specificDependants: '1' }, { specific: 1 }],
        [
          { spouse: 'deduction' as const, generalDependants: '1', specificDependants: '2' },
          { spouse: true, general: 1, specific: 2 },
        ],
      ] as const;
      for (const [form, ref] of cases) {
        const actual = estimate({ salary: String(salary), ...form }).limit;
        expect(
          Math.abs(actual - oracleLimit(salary, ref)),
          `${salary} ${JSON.stringify(form)}`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it('never goes down as income rises across a bracket edge by more than a bracket step explains', () => {
    // the limit is not strictly monotonic (a higher bracket lowers the rate base), but never collapses
    let previous = 0;
    for (let salary = 3_000_000; salary <= 30_000_000; salary += 500_000) {
      const { limit } = estimate({ salary: String(salary) });
      expect(limit, String(salary)).toBeGreaterThan(previous * 0.9);
      previous = limit;
    }
  });
});

describe('special deduction rate table (Sakai City / 総務省)', () => {
  it.each([
    [0, 5],
    [1_950_000, 5],
    [1_951_000, 10],
    [3_300_000, 10],
    [3_301_000, 20],
    [6_950_000, 20],
    [6_951_000, 23],
    [9_000_000, 23],
    [9_001_000, 33],
    [18_000_000, 33],
    [18_001_000, 40],
    [40_000_000, 40],
    [40_001_000, 45],
  ])('reference taxable income %i uses the %i%% bracket', (taxable, rate) => {
    expect(specialDeductionBracketRate(taxable)).toBe(rate);
  });

  it('gives the published rates 84.895% and 79.79% (90% − rate × 1.021)', () => {
    expect(90 - 5 * 1.021).toBeCloseTo(84.895, 9);
    expect(90 - 10 * 1.021).toBeCloseTo(79.79, 9);
    expect(estimate({ salary: '3000000' }).specialDeductionRatePercent).toBeCloseTo(84.895, 6);
  });

  it('computes the limit formula in integers and rounds down', () => {
    expect(donationLimit(100_000, 5)).toBe(Math.floor((100_000 * 0.2) / 0.84895) + 2_000);
    expect(donationLimit(0, 5)).toBe(2_000);
  });
});

describe('estimateFurusatoLimit: edges', () => {
  it('has no benefit at zero, low, and just-taxable incomes', () => {
    for (const salary of ['0', '1000000', '1190000', '1200000']) {
      const r = estimate({ salary });
      expect(r.limit, salary).toBe(0);
      expect(r.basis).toBe('no-resident-income-tax');
    }
    expect(summarize(estimate({ salary: '1000000' }))).toContain('no deduction benefit');
  });

  it('turns on once resident income tax appears', () => {
    expect(estimate({ salary: '1500000' }).limit).toBeGreaterThan(2_000);
  });

  it('handles the largest allowed salary, with the 45% bracket', () => {
    const r = estimate({ salary: '1000000000' });
    expect(r.referenceRatePercent).toBe(45);
    expect(r.limit).toBeGreaterThan(1_000_000);
    expect(r.limit).toBeLessThan(1_000_000_000 * 0.3 + 1);
  });

  it('leaves the spouse deduction out above ¥10M of own income and says so', () => {
    const r = estimate({ salary: '15000000', spouse: 'deduction' });
    expect(r.notes.join(' ')).toContain('spouse deduction was left out');
    expect(r.limit).toBe(estimate({ salary: '15000000' }).limit);
  });

  it('applies the reduced spouse deduction between ¥9M and ¥10M of own income', () => {
    // salary 11,000,000 → employment income 9,050,000 (¥9.0–9.5M bracket: 260,000 / 220,000)
    const withSpouse = estimate({ salary: '11000000', spouse: 'deduction' });
    const without = estimate({ salary: '11000000' });
    expect(withSpouse.notes).toHaveLength(0);
    expect(without.residentTaxableIncome - withSpouse.residentTaxableIncome).toBe(220_000);
    expect(without.incomeTaxableIncome - withSpouse.incomeTaxableIncome).toBe(260_000);
  });

  it('labels the estimate and warns that donating above the limit is not the same benefit', () => {
    const text = summarize(estimate());
    expect(text).toContain('Estimated furusato nozei limit');
    expect(text).toContain('does not give the same benefit');
    expect(text).toContain('not an official calculation');
  });
});

describe('validation', () => {
  const error = (overrides: Partial<FurusatoInput>) => {
    const outcome = estimateFurusatoLimit({
      ...DEFAULT_FURUSATO_INPUT,
      salary: '5000000',
      ...overrides,
    });
    return outcome.ok ? 'ok' : outcome.error;
  };

  it('rejects bad salary input', () => {
    expect(error({ salary: '' })).toBe('salary-empty');
    expect(error({ salary: 'abc' })).toBe('salary-invalid');
    expect(error({ salary: '-5' })).toBe('salary-invalid');
    expect(error({ salary: '1.5' })).toBe('salary-invalid');
    expect(error({ salary: '1000000001' })).toBe('salary-too-large');
  });

  it('rejects bad age, prefecture, dependants and deductions', () => {
    expect(error({ age: '' })).toBe('age-empty');
    expect(error({ age: '17' })).toBe('age-invalid');
    expect(error({ age: '65' })).toBe('age-invalid');
    expect(error({ prefectureId: 'x' })).toBe('prefecture-unknown');
    expect(error({ generalDependants: '-1' })).toBe('dependants-invalid');
    expect(error({ generalDependants: '21' })).toBe('dependants-invalid');
    expect(error({ specificDependants: 'two' })).toBe('dependants-invalid');
    expect(error({ otherDeductions: 'x' })).toBe('other-invalid');
    expect(error({ otherDeductions: '2000000000' })).toBe('other-too-large');
    expect(error({ otherDeductions: '' })).toBe('ok');
  });
});
