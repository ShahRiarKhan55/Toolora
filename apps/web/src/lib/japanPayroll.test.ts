import { describe, expect, it } from 'vitest';
import { PREFECTURES } from '../config/japanMoneyRules';
import {
  calculatePayroll,
  calculateSocialInsurance,
  healthStandardRemuneration,
  parseWholeYen,
  pensionStandardRemuneration,
  roundHalfDown,
} from './japanPayroll';
import type { PayrollInput } from './japanPayroll';

const base: PayrollInput = {
  annualSalary: 4_000_000,
  age: 30,
  prefectureId: 'tokyo',
  enrolled: true,
  employmentInsurance: true,
};

function payroll(overrides: Partial<PayrollInput> = {}) {
  const outcome = calculatePayroll({ ...base, ...overrides });
  if (!outcome.ok) throw new Error(`unexpected error ${outcome.error}`);
  return outcome.value;
}

describe('roundHalfDown', () => {
  it('rounds 50 sen down and more than 50 sen up (JPS payroll convention)', () => {
    expect(roundHalfDown(57_130, 20)).toBe(2_856); // 2,856.5
    expect(roundHalfDown(57_140, 20)).toBe(2_857); // 2,857.0
    expect(roundHalfDown(57_131, 20)).toBe(2_857); // 2,856.55
    expect(roundHalfDown(57_129, 20)).toBe(2_856); // 2,856.45
    expect(roundHalfDown(0, 20)).toBe(0);
  });
});

describe('standard remuneration grades (published JPS / Kyokai Kenpo tables)', () => {
  // The edges come straight from the "円以上〜円未満" columns of the published table. The function takes annual pay, so monthly × 12.
  it.each([
    [62_999, 58_000],
    [63_000, 68_000],
    [92_999, 88_000],
    [93_000, 98_000],
    [100_999, 98_000],
    [101_000, 104_000],
    [194_999, 190_000],
    [195_000, 200_000],
    [209_999, 200_000],
    [210_000, 220_000],
    [634_999, 620_000],
    [635_000, 650_000],
    [664_999, 650_000],
    [665_000, 680_000],
    [1_054_999, 1_030_000],
    [1_055_000, 1_090_000], // above ¥1,030,000 the bounds are not midpoints (the midpoint would be 1,060,000)
    [1_059_999, 1_090_000],
    [1_354_999, 1_330_000],
    [1_355_000, 1_390_000],
    [5_000_000, 1_390_000],
  ])('monthly pay %i is in the %i health grade', (monthly, grade) => {
    expect(healthStandardRemuneration(monthly * 12)).toBe(grade);
  });

  it('clips pension grades to 88,000–650,000', () => {
    expect(pensionStandardRemuneration(60_000 * 12)).toBe(88_000);
    expect(pensionStandardRemuneration(93_000 * 12)).toBe(98_000);
    expect(pensionStandardRemuneration(635_000 * 12)).toBe(650_000);
    expect(pensionStandardRemuneration(900_000 * 12)).toBe(650_000);
  });

  it('has 47 prefecture rates between 9% and 11% and Tokyo at 9.85%', () => {
    expect(PREFECTURES).toHaveLength(47);
    expect(new Set(PREFECTURES.map((p) => p.id)).size).toBe(47);
    for (const p of PREFECTURES) {
      expect(p.healthTotalBp, p.id).toBeGreaterThan(900);
      expect(p.healthTotalBp, p.id).toBeLessThan(1100);
    }
    expect(PREFECTURES.find((p) => p.id === 'tokyo')?.healthTotalBp).toBe(985);
    expect(PREFECTURES.find((p) => p.id === 'niigata')?.healthTotalBp).toBe(921);
    expect(PREFECTURES.find((p) => p.id === 'saga')?.healthTotalBp).toBe(1055);
  });
});

describe('calculateSocialInsurance', () => {
  it('reproduces the published Tokyo table for a ¥340,000 grade (age under 40)', () => {
    // Table: health 33,490.0 total → 16,745.0 half; child support 0.23% → 391.0 half; pension 62,220.00 → 31,110.00.
    const si = calculateSocialInsurance({ ...base, annualSalary: 340_000 * 12 });
    expect(si.healthStandardRemuneration).toBe(340_000);
    expect(si.healthMonthly).toBe(16_745 + 391);
    expect(si.pensionMonthly).toBe(31_110);
    expect(si.careApplies).toBe(false);
  });

  it('adds care insurance (1.62%) only for ages 40 to 64', () => {
    const salary = 340_000 * 12;
    const at39 = calculateSocialInsurance({ ...base, annualSalary: salary, age: 39 });
    const at40 = calculateSocialInsurance({ ...base, annualSalary: salary, age: 40 });
    const at64 = calculateSocialInsurance({ ...base, annualSalary: salary, age: 64 });
    expect(at39.careApplies).toBe(false);
    expect(at40.careApplies).toBe(true);
    expect(at64.careApplies).toBe(true);
    // care half-share on 340,000 = 340,000 × 1.62% ÷ 2 = 2,754
    expect(at40.healthMonthly - at39.healthMonthly).toBe(2_754);
  });

  it('matches the published pension rows at both ends of the grade table', () => {
    expect(calculateSocialInsurance({ ...base, annualSalary: 80_000 * 12 }).pensionMonthly).toBe(
      8_052,
    ); // 16,104.00 ÷ 2
    expect(calculateSocialInsurance({ ...base, annualSalary: 650_000 * 12 }).pensionMonthly).toBe(
      59_475,
    ); // 118,950.00 ÷ 2
    expect(calculateSocialInsurance({ ...base, annualSalary: 2_000_000 * 12 }).pensionMonthly).toBe(
      59_475,
    );
  });

  it('charges employment insurance at 0.5% of pay, rounded half down', () => {
    // ¥300,000 a month → 1,500 exactly
    expect(calculateSocialInsurance({ ...base, annualSalary: 3_600_000 }).employmentMonthly).toBe(
      1_500,
    );
    // ¥250,100 a month → 1,250.5 → rounds down to 1,250
    expect(
      calculateSocialInsurance({ ...base, annualSalary: 250_100 * 12 }).employmentMonthly,
    ).toBe(1_250);
    // ¥250,120 a month → 1,250.6 → 1,251
    expect(
      calculateSocialInsurance({ ...base, annualSalary: 250_120 * 12 }).employmentMonthly,
    ).toBe(1_251);
  });

  it('can switch off social insurance and employment insurance independently', () => {
    const none = calculateSocialInsurance({ ...base, enrolled: false, employmentInsurance: false });
    expect(none.total).toBe(0);
    const eiOnly = calculateSocialInsurance({ ...base, enrolled: false });
    expect(eiOnly.healthAnnual + eiOnly.pensionAnnual).toBe(0);
    expect(eiOnly.employmentAnnual).toBeGreaterThan(0);
    const siOnly = calculateSocialInsurance({ ...base, employmentInsurance: false });
    expect(siOnly.employmentAnnual).toBe(0);
    expect(siOnly.healthAnnual).toBeGreaterThan(0);
  });

  it('uses the chosen prefecture’s rate', () => {
    const salary = 340_000 * 12;
    const tokyo = calculateSocialInsurance({
      ...base,
      annualSalary: salary,
      prefectureId: 'tokyo',
    });
    const saga = calculateSocialInsurance({ ...base, annualSalary: salary, prefectureId: 'saga' });
    const niigata = calculateSocialInsurance({
      ...base,
      annualSalary: salary,
      prefectureId: 'niigata',
    });
    expect(saga.healthMonthly).toBeGreaterThan(tokyo.healthMonthly);
    expect(niigata.healthMonthly).toBeLessThan(tokyo.healthMonthly);
    // Saga: 340,000 × (10.55% + 0.23%) ÷ 2 = 18,326
    expect(saga.healthMonthly).toBe(18_326);
  });

  it('throws for an unknown prefecture (callers validate first)', () => {
    expect(() => calculateSocialInsurance({ ...base, prefectureId: 'atlantis' })).toThrow();
  });
});

describe('calculatePayroll', () => {
  it('matches the worked ¥4,000,000 example derived by hand from the published rules', () => {
    // standard remuneration 340,000: health 17,136 + pension 31,110 + employment 1,667 = 49,913 a month.
    const result = payroll();
    expect(result.ruleYearLabel).toBe('2026 (令和8年)');
    expect(result.socialInsurance.healthMonthly).toBe(17_136);
    expect(result.socialInsurance.pensionMonthly).toBe(31_110);
    expect(result.socialInsurance.employmentMonthly).toBe(1_667);
    expect(result.socialInsurance.total).toBe(598_956);
    expect(result.incomeTaxAnnual).toBe(57_200);
    expect(result.residentTaxAnnual).toBe(175_600);
    expect(result.totalDeductionsAnnual).toBe(831_756);
    expect(result.takeHomeAnnual).toBe(3_168_244);
    expect(result.monthly.takeHome).toBe(264_020);
  });

  it('represents resident tax as a steady-state estimate from the entered income, never from a prior year', () => {
    const r = payroll();
    expect(r.residentTaxModel).toBe('steady-state');
    // the only income the model has is the entered one: resident tax is exactly the 令和9年度 rules on that income
    // (taxable 1,731,000 → levy 173,100 − 2,500 credit + ¥5,000 per capita; hand-derived for ¥4,000,000)
    expect(r.taxes.residentTax.taxableIncome).toBe(1_731_000);
    expect(r.residentTaxAnnual).toBe(175_600);
    // so a different entered salary changes it immediately; there is no "last year" input to lag behind
    expect(payroll({ annualSalary: 6_000_000 }).residentTaxAnnual).toBeGreaterThan(
      r.residentTaxAnnual,
    );
    expect(calculatePayroll({ ...base }).ok).toBe(true);
    expect(Object.keys(base)).not.toContain('previousYearSalary');
  });

  it('is consistent between monthly and annual figures', () => {
    for (const annualSalary of [
      1_200_000, 2_500_000, 3_600_000, 4_999_999, 7_000_000, 12_000_000,
    ]) {
      const r = payroll({ annualSalary });
      expect(r.takeHomeAnnual, String(annualSalary)).toBe(
        annualSalary - r.socialInsurance.total - r.incomeTaxAnnual - r.residentTaxAnnual,
      );
      for (const [monthly, annual] of [
        [r.monthly.health, r.socialInsurance.healthAnnual],
        [r.monthly.pension, r.socialInsurance.pensionAnnual],
        [r.monthly.employment, r.socialInsurance.employmentAnnual],
        [r.monthly.incomeTax, r.incomeTaxAnnual],
        [r.monthly.residentTax, r.residentTaxAnnual],
        [r.monthly.takeHome, r.takeHomeAnnual],
      ] as const) {
        expect(Math.abs(monthly * 12 - annual)).toBeLessThanOrEqual(6);
      }
    }
  });

  it('gives the same result whether a salary is typed monthly (×12) or annually', () => {
    expect(payroll({ annualSalary: 300_000 * 12 })).toEqual(payroll({ annualSalary: 3_600_000 }));
  });

  it('never takes home more with a higher salary within the same insurance grade, and stays positive', () => {
    let previous = 0;
    for (let annualSalary = 1_000_000; annualSalary <= 20_000_000; annualSalary += 100_000) {
      const r = payroll({ annualSalary });
      expect(r.takeHomeAnnual, String(annualSalary)).toBeGreaterThan(0);
      // Grade steps and bracket edges can move net by a few thousand yen, but a ¥100,000 raise never lowers it by more.
      expect(r.takeHomeAnnual).toBeGreaterThan(previous - 60_000);
      previous = r.takeHomeAnnual;
    }
  });

  it('has no income tax at low pay and no taxes at all just under the resident-tax limit', () => {
    const low = payroll({ annualSalary: 1_190_000, enrolled: false, employmentInsurance: false });
    expect(low.incomeTaxAnnual).toBe(0);
    expect(low.residentTaxAnnual).toBe(0);
    expect(low.takeHomeAnnual).toBe(1_190_000);
    const justAbove = payroll({
      annualSalary: 1_791_000,
      enrolled: false,
      employmentInsurance: false,
    });
    // employment income 1,051,000 − basic 1,040,000 = 11,000 → 5% = 550 → × 102.1% = 561.55 → ¥500
    expect(justAbove.incomeTaxAnnual).toBe(500);
  });

  it('applies the pension cap: pension premium stops rising above a ¥650,000 standard remuneration', () => {
    const a = payroll({ annualSalary: 650_000 * 12 });
    const b = payroll({ annualSalary: 900_000 * 12 });
    expect(a.socialInsurance.pensionMonthly).toBe(59_475);
    expect(b.socialInsurance.pensionMonthly).toBe(59_475);
    expect(b.socialInsurance.healthMonthly).toBeGreaterThan(a.socialInsurance.healthMonthly);
  });

  it('rejects invalid input with a specific error', () => {
    const error = (overrides: Partial<PayrollInput>) => {
      const outcome = calculatePayroll({ ...base, ...overrides });
      return outcome.ok ? 'ok' : outcome.error;
    };
    expect(error({ annualSalary: -1 })).toBe('salary-invalid');
    expect(error({ annualSalary: 1.5 })).toBe('salary-invalid');
    expect(error({ annualSalary: Number.NaN })).toBe('salary-invalid');
    expect(error({ annualSalary: 1_000_000_001 })).toBe('salary-too-large');
    expect(error({ age: 17 })).toBe('age-invalid');
    expect(error({ age: 65 })).toBe('age-invalid');
    expect(error({ age: 30.5 })).toBe('age-invalid');
    expect(error({ annualSalary: 0 })).toBe('insurance-exceeds-pay');
    expect(error({ annualSalary: 0, enrolled: false, employmentInsurance: false })).toBe('ok');
  });

  it('accepts the largest allowed salary', () => {
    const r = payroll({ annualSalary: 1_000_000_000 });
    expect(r.takeHomeAnnual).toBeGreaterThan(0);
    expect(r.takeHomeAnnual).toBeLessThan(1_000_000_000);
    expect(r.taxes.incomeTax.ratePercent).toBe(45);
  });

  it('combines assumptions: age 45 in Osaka with only employment insurance', () => {
    const r = payroll({ age: 45, prefectureId: 'osaka', enrolled: false, annualSalary: 3_000_000 });
    expect(r.socialInsurance.healthAnnual).toBe(0);
    expect(r.socialInsurance.pensionAnnual).toBe(0);
    expect(r.socialInsurance.employmentMonthly).toBe(1_250);
    expect(r.socialInsurance.careApplies).toBe(true); // the flag follows age, but nothing is charged when not enrolled
    expect(r.socialInsurance.total).toBe(15_000);
  });
});

describe('parseWholeYen', () => {
  it('accepts plain numbers, commas and a yen sign', () => {
    expect(parseWholeYen('300000')).toBe(300_000);
    expect(parseWholeYen(' 3,600,000 ')).toBe(3_600_000);
    expect(parseWholeYen('¥250,000')).toBe(250_000);
    expect(parseWholeYen('0')).toBe(0);
  });

  it('rejects empty, decimals, negatives and text', () => {
    for (const text of ['', '   ', '1.5', '-1', 'abc', '1e6', '12abc']) {
      expect(parseWholeYen(text), text).toBeUndefined();
    }
  });
});
