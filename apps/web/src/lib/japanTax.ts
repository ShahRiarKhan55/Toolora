import {
  EMPLOYMENT_INCOME_DEDUCTION,
  INCOME_TAX_BASIC_DEDUCTION,
  INCOME_TAX_BASIC_DEDUCTION_ABOVE,
  INCOME_TAX_BRACKETS,
  INCOME_TAX_TOP_BRACKET,
  INCOME_TAX_FINAL_ROUNDING,
  INCOME_TAX_WITH_RECONSTRUCTION_PERMILLE,
  RESIDENT_TAX,
} from '../config/japanMoneyRules';

/**
 * Income tax and resident tax arithmetic for an employee, on the rules in `config/japanMoneyRules`.
 * Everything is whole yen in integer arithmetic (amounts stay far below 2^53 because callers cap input
 * at ¥1 billion), so there is no floating-point drift. Rounding is stated on each function.
 */

/** Integer division, rounding toward zero, without a float quotient (n and d are whole numbers, d > 0). */
export function intDiv(n: number, d: number): number {
  return (n - (n % d)) / d;
}

export function floorTo(n: number, unit: number): number {
  return intDiv(n, unit) * unit;
}

/**
 * Employment income (給与所得) from gross salary, NTA No.1410, 令和8年分・令和9年度.
 * - under ¥741,000: nothing; ¥741,000 up to ¥2.2M: salary − ¥740,000, with NTA note 2's stepped values
 *   between ¥2,191,000 and ¥2.2M;
 * - from ¥2.2M: the bracket formula. Below ¥6.6M the NTA's 令和8年分 table (別表第五) applies the formula to
 *   the salary rounded down to a ¥4,000 bucket; at ¥6.6M and over, to the exact salary.
 * Matches every row read from the NTA table (lib/japanTax.test.ts). Fractions of a yen are rounded down.
 */
export function employmentIncome(salary: number): number {
  const rule = EMPLOYMENT_INCOME_DEDUCTION;
  if (salary < rule.zeroIncomeBelow) return 0;
  if (salary < rule.steppedBelow) {
    let income = salary - rule.minimumDeduction;
    for (const step of rule.steppedIncomes) {
      if (salary >= step.from) income = step.income;
    }
    return income;
  }
  if (salary > 8_500_000) return salary - rule.cap;
  const base = salary < rule.tableRoundingBelow ? floorTo(salary, rule.tableRoundingStep) : salary;
  for (const bracket of rule.formulaBrackets) {
    if (base <= bracket.upTo) return intDiv(base * bracket.keepPercent, 100) - bracket.subtract;
  }
  return salary - rule.cap;
}

/** Income-tax basic deduction for a total income (合計所得金額), NTA No.1199, 令和8年分. */
export function incomeTaxBasicDeduction(totalIncome: number): number {
  for (const bracket of INCOME_TAX_BASIC_DEDUCTION) {
    if (totalIncome <= bracket.upTo) return bracket.amount;
  }
  return INCOME_TAX_BASIC_DEDUCTION_ABOVE;
}

export interface IncomeTaxResult {
  /** Taxable income, rounded down to ¥1,000. */
  taxableIncome: number;
  /** 算出所得税額: tax from the NTA quick-reference table, before the reconstruction tax. */
  baseTax: number;
  /** 年調年税額: baseTax × 102.1%, rounded down to ¥100. */
  total: number;
  /** Marginal bracket rate (percent) that applied; 0 when nothing is taxable. */
  ratePercent: number;
}

/**
 * Income tax plus reconstruction special income tax, following the NTA's 令和8年分 year-end adjustment
 * procedure (年末調整のしかた):
 *   1. taxable income: a fraction under ¥1,000 is rounded down;
 *   2. 算出所得税額: the NTA quick-reference table (No.2260) on that amount;
 *   3. 年調年税額: that tax × 102.1% (includes the 2.1% reconstruction tax), a fraction under ¥100 rounded down.
 * This is the model's annual figure; real monthly withholding is settled against it at year-end adjustment.
 */
export function incomeTaxOn(taxable: number): IncomeTaxResult {
  const taxableIncome = floorTo(Math.max(0, taxable), 1000);
  if (taxableIncome === 0) {
    return { taxableIncome, baseTax: 0, total: 0, ratePercent: 0 };
  }
  const bracket =
    INCOME_TAX_BRACKETS.find((b) => taxableIncome <= b.upTo) ?? INCOME_TAX_TOP_BRACKET;
  const baseTax = intDiv(taxableIncome * bracket.ratePercent, 100) - bracket.deduction;
  const withReconstruction = intDiv(baseTax * INCOME_TAX_WITH_RECONSTRUCTION_PERMILLE, 1000);
  return {
    taxableIncome,
    baseTax,
    total: floorTo(withReconstruction, INCOME_TAX_FINAL_ROUNDING),
    ratePercent: bracket.ratePercent,
  };
}

/** Personal deductions beyond the basic deduction (spouse, dependants, other), per tax. */
export interface ExtraDeductions {
  incomeTax: number;
  resident: number;
  /** Sum of (income tax amount − resident tax amount) for the personal deductions above, for the adjustment credit. */
  adjustmentDifference: number;
}
export const NO_EXTRA_DEDUCTIONS: ExtraDeductions = {
  incomeTax: 0,
  resident: 0,
  adjustmentDifference: 0,
};

export interface ResidentTaxResult {
  basicDeduction: number;
  taxableIncome: number;
  /** 10% income levy before the adjustment credit. */
  levyBeforeCredit: number;
  adjustmentCredit: number;
  /** Income levy before rounding to ¥100 (used by the furusato limit). */
  levyUnrounded: number;
  /** Income levy payable, rounded down to ¥100. */
  incomeLevy: number;
  /** Per-capita levy including the national forest tax (standard amount; varies locally). */
  perCapita: number;
  total: number;
  exempt: boolean;
}

/**
 * Resident tax (住民税) on income earned in the year, 令和9年度 rules. `totalIncome` is the total income
 * (for an employee with no other income, the employment income). Single-person exemption: no tax at or
 * below ¥450,000 of total income. Adjustment credit and rounding: see `RESIDENT_TAX`.
 */
export function residentTaxOn(args: {
  totalIncome: number;
  /** Everything deducted from total income except the basic deduction: social insurance, extras, other. */
  deductions: number;
  extra?: ExtraDeductions;
  /** Apply the single-person exemption limit. Households skip it: their taxable income reaches zero first. */
  applyExemption?: boolean;
}): ResidentTaxResult {
  const { totalIncome, deductions, extra = NO_EXTRA_DEDUCTIONS, applyExemption = true } = args;
  const basic = RESIDENT_TAX.basicDeduction.find((b) => totalIncome <= b.upTo)?.amount ?? 0;
  const taxableIncome = floorTo(Math.max(0, totalIncome - deductions - basic), 1000);
  const exempt = applyExemption && totalIncome <= RESIDENT_TAX.nonTaxableTotalIncome;
  if (exempt) {
    return {
      basicDeduction: basic,
      taxableIncome,
      levyBeforeCredit: 0,
      adjustmentCredit: 0,
      levyUnrounded: 0,
      incomeLevy: 0,
      perCapita: 0,
      total: 0,
      exempt: true,
    };
  }
  const levyBeforeCredit = intDiv(taxableIncome * RESIDENT_TAX.incomeLevyPercent, 100);
  const adj = RESIDENT_TAX.adjustment;
  let adjustmentCredit = 0;
  if (totalIncome <= adj.maxTotalIncome && taxableIncome > 0) {
    const difference = adj.basicDifference + extra.adjustmentDifference;
    adjustmentCredit =
      taxableIncome <= adj.lowTaxableLimit
        ? intDiv(Math.min(difference, taxableIncome) * adj.creditPercent, 100)
        : Math.max(
            adj.minimumCredit,
            intDiv((difference - (taxableIncome - adj.lowTaxableLimit)) * adj.creditPercent, 100),
          );
  }
  const levyUnrounded = Math.max(0, levyBeforeCredit - adjustmentCredit);
  const incomeLevy = floorTo(levyUnrounded, RESIDENT_TAX.levyRounding);
  return {
    basicDeduction: basic,
    taxableIncome,
    levyBeforeCredit,
    adjustmentCredit,
    levyUnrounded,
    incomeLevy,
    perCapita: RESIDENT_TAX.perCapitaStandard,
    total: incomeLevy + RESIDENT_TAX.perCapitaStandard,
    exempt: false,
  };
}

export interface TaxesResult {
  employmentIncome: number;
  incomeTaxBasicDeduction: number;
  incomeTax: IncomeTaxResult;
  residentTax: ResidentTaxResult;
}

/**
 * Both taxes for an employee whose only income is salary, after social insurance
 * (`socialInsuranceDeduction`, fully deductible) and any extra deductions.
 */
export function computeTaxes(args: {
  salary: number;
  socialInsuranceDeduction: number;
  extra?: ExtraDeductions;
  /** Other deductions applied equally to both taxes (e.g. iDeCo); see the furusato tool's assumptions. */
  otherDeductions?: number;
  applyResidentExemption?: boolean;
}): TaxesResult {
  const { salary, socialInsuranceDeduction, extra = NO_EXTRA_DEDUCTIONS } = args;
  const other = args.otherDeductions ?? 0;
  const income = employmentIncome(salary);
  const basic = incomeTaxBasicDeduction(income);
  const incomeTax = incomeTaxOn(
    income - socialInsuranceDeduction - other - extra.incomeTax - basic,
  );
  const residentTax = residentTaxOn({
    totalIncome: income,
    deductions: socialInsuranceDeduction + other + extra.resident,
    extra,
    applyExemption: args.applyResidentExemption,
  });
  return { employmentIncome: income, incomeTaxBasicDeduction: basic, incomeTax, residentTax };
}
