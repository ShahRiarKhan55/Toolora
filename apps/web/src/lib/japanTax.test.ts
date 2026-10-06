import { describe, expect, it } from 'vitest';
import {
  computeTaxes,
  employmentIncome,
  floorTo,
  incomeTaxBasicDeduction,
  incomeTaxOn,
  intDiv,
  residentTaxOn,
} from './japanTax';
import { NTA_2026_SALARY_INCOME_TABLE } from './fixtures/nta2026SalaryIncomeTable';

// --- Independent oracles -------------------------------------------------------------------------------
// These express the same published rules in a different shape from the implementation, so a slip in
// one is not silently copied into the other.

/** NTA No.1410 as printed: the *deduction* by salary (the code computes the income after it). */
function ntaDeduction(salary: number): number {
  if (salary <= 2_200_000) return 740_000;
  if (salary <= 3_600_000) return Math.round(salary * 0.3) + 80_000;
  if (salary <= 6_600_000) return Math.round(salary * 0.2) + 440_000;
  if (salary <= 8_500_000) return Math.round(salary * 0.1) + 1_100_000;
  return 1_950_000;
}

/** NTA No.2260 as marginal slices, not the quick-reference "rate and deduction" table. */
function marginalTax(taxable: number): number {
  const slices: [number, number][] = [
    [1_950_000, 0.05],
    [3_300_000, 0.1],
    [6_950_000, 0.2],
    [9_000_000, 0.23],
    [18_000_000, 0.33],
    [40_000_000, 0.4],
    [Infinity, 0.45],
  ];
  let tax = 0;
  let from = 0;
  for (const [to, rate] of slices) {
    if (taxable > from) tax += (Math.min(taxable, to) - from) * rate;
    from = to;
  }
  return Math.floor(Math.round(tax * 1000) / 1000);
}

describe('employmentIncome (NTA No.1410, 2026)', () => {
  it.each([
    [0, 0],
    [740_999, 0], // under ¥741,000 there is no employment income
    [741_000, 1_000],
    [1_000_000, 260_000],
    [1_780_000, 1_040_000],
    [2_190_999, 1_450_999],
    [2_191_000, 1_451_000], // NTA note 2: stepped values just below ¥2.2M
    [2_192_999, 1_451_000],
    [2_193_000, 1_453_000],
    [2_195_999, 1_453_000],
    [2_196_000, 1_456_000],
    [2_199_999, 1_456_000],
    [2_200_000, 1_460_000],
    [3_000_000, 2_020_000],
    [3_600_000, 2_440_000],
    [3_603_999, 2_440_000], // below ¥6.6M the salary is rounded down to ¥4,000
    [5_000_000, 3_560_000],
    [6_600_000, 4_840_000],
    [6_600_001, 4_840_000], // ¥6.6M and over: exact salary, 6,600,001 × 0.9 − 1,100,000 = 4,840,000.9
    [7_000_000, 5_200_000],
    [8_500_000, 6_550_000],
    [8_500_001, 6_550_001],
    [10_000_000, 8_050_000],
    [1_000_000_000, 998_050_000],
  ])('salary %i gives employment income %i', (salary, expected) => {
    expect(employmentIncome(salary)).toBe(expected);
  });

  it('agrees with the NTA deduction table at every ¥4,000 step from ¥2.2M to ¥6.6M and beyond', () => {
    for (let salary = 2_200_000; salary <= 9_000_000; salary += 4_000) {
      expect(employmentIncome(salary), String(salary)).toBe(salary - ntaDeduction(salary));
    }
  });

  it('matches every row read from the NTA 令和8年分 table (別表第五) at both ends of its ¥4,000 bucket', () => {
    expect(NTA_2026_SALARY_INCOME_TABLE.length).toBeGreaterThan(1000);
    const mismatches = NTA_2026_SALARY_INCOME_TABLE.filter(
      ([from, income]) =>
        employmentIncome(from) !== income || employmentIncome(from + 3_999) !== income,
    );
    expect(mismatches).toEqual([]);
  });

  it('puts the first salary of the next bucket in the next row, with no overlap or gap', () => {
    // the NTA table's first rows: [2,204,000, 2,208,000) → 1,462,800 and [2,208,000, 2,212,000) → 1,465,600
    expect(employmentIncome(2_203_999)).toBe(1_460_000);
    expect(employmentIncome(2_204_000)).toBe(1_462_800);
    expect(employmentIncome(2_207_999)).toBe(1_462_800);
    expect(employmentIncome(2_208_000)).toBe(1_465_600);
    // and the last bucket below ¥6.6M, then the exact-salary formula from ¥6.6M
    expect(employmentIncome(6_596_000)).toBe(4_836_800);
    expect(employmentIncome(6_599_999)).toBe(4_836_800);
    expect(employmentIncome(6_600_000)).toBe(4_840_000);
  });

  it('never decreases as salary grows (no cliff at any bracket edge)', () => {
    let previous = employmentIncome(0);
    for (let salary = 0; salary <= 9_000_000; salary += 1_000) {
      const current = employmentIncome(salary);
      expect(current, String(salary)).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });
});

describe('incomeTaxBasicDeduction (NTA No.1199, 2026)', () => {
  it.each([
    [0, 1_040_000],
    [4_890_000, 1_040_000],
    [4_890_001, 670_000],
    [6_550_000, 670_000],
    [6_550_001, 620_000],
    [23_500_000, 620_000],
    [23_500_001, 480_000],
    [24_000_000, 480_000],
    [24_000_001, 320_000],
    [24_500_000, 320_000],
    [24_500_001, 160_000],
    [25_000_000, 160_000],
    [25_000_001, 0],
  ])('total income %i gives %i', (income, expected) => {
    expect(incomeTaxBasicDeduction(income)).toBe(expected);
  });
});

describe('incomeTaxOn (NTA No.2260)', () => {
  it('is zero for no taxable income and under ¥1,000', () => {
    expect(incomeTaxOn(0).total).toBe(0);
    expect(incomeTaxOn(999).total).toBe(0);
    expect(incomeTaxOn(-5_000).total).toBe(0);
  });

  it.each([
    [1_949_000, 97_450, 5],
    [1_950_000, 97_500, 10], // the quick-reference table is continuous at each bracket edge
    [3_299_000, 232_400, 10],
    [3_300_000, 232_500, 20],
    [6_949_000, 962_300, 20],
    [6_950_000, 962_500, 23],
    [8_999_000, 1_433_770, 23],
    [9_000_000, 1_434_000, 33],
    [17_999_000, 4_403_670, 33],
    [18_000_000, 4_404_000, 40],
    [39_999_000, 13_203_600, 40],
    [40_000_000, 13_204_000, 45],
  ])('taxable %i has base tax %i at %i%%', (taxable, base, rate) => {
    const result = incomeTaxOn(taxable);
    expect(result.baseTax).toBe(base);
    expect(result.ratePercent).toBe(rate);
  });

  it('matches the marginal-slice oracle across the whole range', () => {
    for (const taxable of [
      1_000, 500_000, 1_234_000, 1_949_000, 1_950_000, 2_500_000, 3_300_000, 5_000_000, 6_950_000,
      8_000_000, 9_000_000, 12_345_000, 18_000_000, 25_000_000, 40_000_000, 100_000_000,
      999_999_000,
    ]) {
      expect(incomeTaxOn(taxable).baseTax, String(taxable)).toBe(marginalTax(taxable));
    }
  });

  it('rounds taxable income down to ¥1,000, then the tax × 102.1% down to ¥100 (NTA 年末調整のしかた)', () => {
    const result = incomeTaxOn(3_299_999); // taxable 3,299,000
    expect(result.taxableIncome).toBe(3_299_000);
    expect(result.baseTax).toBe(232_400);
    // 232,400 × 1.021 = 237,280.4 → ¥237,200 (not ¥237,280: the final amount goes down to ¥100)
    expect(result.total).toBe(237_200);
  });

  it('truncates the taxable income at every ¥1,000 edge', () => {
    expect(incomeTaxOn(1_999).taxableIncome).toBe(1_000);
    expect(incomeTaxOn(2_000).taxableIncome).toBe(2_000);
    expect(incomeTaxOn(1_949_999).taxableIncome).toBe(1_949_000);
    expect(incomeTaxOn(1_950_000).taxableIncome).toBe(1_950_000);
    expect(incomeTaxOn(1_950_000).ratePercent).toBe(10);
    expect(incomeTaxOn(1_949_999).ratePercent).toBe(5);
  });

  it('truncates the final amount at the ¥100 transitions around 102.1%', () => {
    // 5% bracket, base tax is a multiple of ¥50: 4,750 → 4,849.75 → 4,800; 4,800 → 4,900.8 → 4,900
    expect(incomeTaxOn(95_000).baseTax).toBe(4_750);
    expect(incomeTaxOn(95_000).total).toBe(4_800);
    expect(incomeTaxOn(96_000).baseTax).toBe(4_800);
    expect(incomeTaxOn(96_000).total).toBe(4_900);
    // an exact multiple: base 100,000 × 1.021 = 102,100 exactly, so nothing is dropped; one ¥1,000 step lower is 101,997.9 → 101,900
    expect(incomeTaxOn(1_975_000).baseTax).toBe(100_000);
    expect(incomeTaxOn(1_975_000).total).toBe(102_100);
    expect(incomeTaxOn(1_974_000).baseTax).toBe(99_900);
    expect(incomeTaxOn(1_974_000).total).toBe(101_900);
  });

  it('is always a multiple of ¥100 and between the base tax and base × 1.021', () => {
    for (let taxable = 1_000; taxable <= 60_000_000; taxable += 137_000) {
      const { baseTax, total } = incomeTaxOn(taxable);
      expect(total % 100, String(taxable)).toBe(0);
      expect(total, String(taxable)).toBeLessThanOrEqual(Math.floor((baseTax * 1021) / 1000));
      expect(total, String(taxable)).toBeGreaterThan((baseTax * 1021) / 1000 - 100);
    }
  });

  it('gives no tax for a tiny base amount that rounds below ¥100', () => {
    // taxable 1,000 → 5% = 50 → × 1.021 = 51.05 → ¥0 after truncating to ¥100
    expect(incomeTaxOn(1_000).baseTax).toBe(50);
    expect(incomeTaxOn(1_000).total).toBe(0);
    expect(incomeTaxOn(2_000).baseTax).toBe(100);
    expect(incomeTaxOn(2_000).total).toBe(100);
  });
});

describe('residentTaxOn (令和9年度 rules)', () => {
  it('charges nothing at or below ¥450,000 of total income, and the levy just above it', () => {
    expect(residentTaxOn({ totalIncome: 450_000, deductions: 0 }).total).toBe(0);
    const above = residentTaxOn({ totalIncome: 450_001, deductions: 0 });
    expect(above.exempt).toBe(false);
    expect(above.perCapita).toBe(5_000);
    // taxable = 450,001 − 430,000 = 20,001 → 20,000; levy 2,000 − credit min(50,000, 20,000) × 5% = 1,000
    expect(above.taxableIncome).toBe(20_000);
    expect(above.adjustmentCredit).toBe(1_000);
    expect(above.incomeLevy).toBe(1_000);
    expect(above.total).toBe(6_000);
  });

  it('computes a mid-income case by hand', () => {
    // total income 2,760,000, social insurance 598,956: taxable 1,731,044 → 1,731,000
    const result = residentTaxOn({ totalIncome: 2_760_000, deductions: 598_956 });
    expect(result.taxableIncome).toBe(1_731_000);
    expect(result.levyBeforeCredit).toBe(173_100);
    expect(result.adjustmentCredit).toBe(2_500); // 5% of the ¥50,000 basic-deduction difference
    expect(result.incomeLevy).toBe(170_600);
    expect(result.total).toBe(175_600);
  });

  it('applies the adjustment credit rules above ¥2,000,000 taxable, with the ¥2,500 floor', () => {
    const at = residentTaxOn({ totalIncome: 4_430_000, deductions: 0 }); // taxable 4,000,000
    expect(at.taxableIncome).toBe(4_000_000);
    expect(at.adjustmentCredit).toBe(2_500);
    expect(at.incomeLevy).toBe(397_500);
    // a household with a larger difference: (50,000 + 180,000 − (2,100,000 − 2,000,000)) × 5% = 6,500
    const household = residentTaxOn({
      totalIncome: 2_530_000,
      deductions: 0,
      extra: { incomeTax: 0, resident: 0, adjustmentDifference: 180_000 },
    });
    expect(household.taxableIncome).toBe(2_100_000);
    expect(household.adjustmentCredit).toBe(6_500);
  });

  it('uses the lower basic deductions and drops the credit above ¥25M of income', () => {
    expect(residentTaxOn({ totalIncome: 24_000_000, deductions: 0 }).basicDeduction).toBe(430_000);
    expect(residentTaxOn({ totalIncome: 24_000_001, deductions: 0 }).basicDeduction).toBe(290_000);
    expect(residentTaxOn({ totalIncome: 24_500_001, deductions: 0 }).basicDeduction).toBe(150_000);
    const top = residentTaxOn({ totalIncome: 25_000_001, deductions: 0 });
    expect(top.basicDeduction).toBe(0);
    expect(top.adjustmentCredit).toBe(0);
  });

  it('rounds the income levy down to ¥100', () => {
    const result = residentTaxOn({ totalIncome: 1_000_000, deductions: 0 }); // taxable 570,000
    expect(result.levyBeforeCredit).toBe(57_000);
    expect(result.adjustmentCredit).toBe(2_500);
    expect(result.levyUnrounded).toBe(54_500);
    expect(result.incomeLevy).toBe(54_500);
    const odd = residentTaxOn({
      totalIncome: 1_000_000,
      deductions: 0,
      extra: { incomeTax: 0, resident: 0, adjustmentDifference: 30_000 },
    });
    expect(odd.adjustmentCredit).toBe(4_000);
    expect(odd.incomeLevy % 100).toBe(0);
  });
});

describe('computeTaxes', () => {
  it('matches a worked ¥4,000,000 example (hand-computed from the published rules)', () => {
    const result = computeTaxes({ salary: 4_000_000, socialInsuranceDeduction: 598_956 });
    expect(result.employmentIncome).toBe(2_760_000);
    expect(result.incomeTaxBasicDeduction).toBe(1_040_000);
    // 2,760,000 − 598,956 − 1,040,000 = 1,121,044 → 1,121,000 × 5% = 56,050; × 102.1% = 57,227.05 → 57,200
    expect(result.incomeTax.taxableIncome).toBe(1_121_000);
    expect(result.incomeTax.baseTax).toBe(56_050);
    expect(result.incomeTax.total).toBe(57_200);
    expect(result.residentTax.total).toBe(175_600);
  });

  it('has no income tax on salary up to ¥1,780,000 even with no social insurance', () => {
    expect(computeTaxes({ salary: 1_780_000, socialInsuranceDeduction: 0 }).incomeTax.total).toBe(
      0,
    );
    // ¥1,781,000 → employment income 1,041,000 − basic 1,040,000 = 1,000 → 5% = 50 → × 102.1% = 51 → ¥0 after
    // truncating to ¥100; the first ¥100 of tax appears when the base tax reaches ¥100
    expect(computeTaxes({ salary: 1_781_000, socialInsuranceDeduction: 0 }).incomeTax.total).toBe(
      0,
    );
    expect(computeTaxes({ salary: 1_782_000, socialInsuranceDeduction: 0 }).incomeTax.total).toBe(
      100,
    );
  });

  it('has no resident tax on salary up to ¥1,190,000 and some just above', () => {
    expect(computeTaxes({ salary: 1_190_000, socialInsuranceDeduction: 0 }).residentTax.total).toBe(
      0,
    );
    // income 451,000: taxable 21,000 → levy 2,100 − credit 1,050 = 1,050 → ¥1,000 after rounding, plus 5,000
    expect(computeTaxes({ salary: 1_191_000, socialInsuranceDeduction: 0 }).residentTax.total).toBe(
      6_000,
    );
  });

  it('handles zero salary and a very large salary without overflow or negative tax', () => {
    const zero = computeTaxes({ salary: 0, socialInsuranceDeduction: 0 });
    expect(zero.incomeTax.total).toBe(0);
    expect(zero.residentTax.total).toBe(0);
    const big = computeTaxes({ salary: 1_000_000_000, socialInsuranceDeduction: 2_000_000 });
    const base = marginalTax(big.incomeTax.taxableIncome);
    expect(big.incomeTax.total).toBe(Math.floor((base * 1021) / 1000 / 100) * 100);
    expect(big.incomeTax.total).toBeGreaterThan(0);
  });

  it('floorTo and intDiv behave on exact multiples and remainders', () => {
    expect(floorTo(1_999, 1_000)).toBe(1_000);
    expect(floorTo(2_000, 1_000)).toBe(2_000);
    expect(intDiv(7, 2)).toBe(3);
    expect(intDiv(0, 5)).toBe(0);
  });
});
