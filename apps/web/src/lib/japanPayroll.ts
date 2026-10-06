import {
  HEALTH_GRADES,
  JAPAN_MONEY_RULE_YEAR_LABEL,
  PENSION_STANDARD_REMUNERATION_RANGE,
  PREFECTURES,
  SOCIAL_INSURANCE_RATES,
} from '../config/japanMoneyRules';
import { computeTaxes } from './japanTax';
import type { TaxesResult } from './japanTax';

/** Largest annual salary accepted (¥1 billion): keeps every product below far inside safe integers. */
export const MAX_ANNUAL_SALARY = 1_000_000_000;
export const MIN_AGE = 18;
export const MAX_AGE = 64;

/**
 * Rounds n/d to a whole yen the way an employer deducting insurance from pay does: a fraction of 50
 * sen or less goes down, more than 50 sen goes up (Japan Pension Service, "保険料の計算方法").
 */
export function roundHalfDown(n: number, d: number): number {
  const remainder = n % d;
  const quotient = (n - remainder) / d;
  return remainder * 2 > d ? quotient + 1 : quotient;
}

/**
 * Monthly standard remuneration for health insurance: the grade whose published lower bound the monthly
 * pay has reached. The comparison is made on the annual figure (12 × bound). Assumes 12 equal monthly
 * payments and no bonus.
 */
export function healthStandardRemuneration(annualSalary: number): number {
  let standard: number = HEALTH_GRADES[0].standard;
  for (const grade of HEALTH_GRADES) {
    if (annualSalary >= 12 * grade.from) standard = grade.standard;
    else break;
  }
  return standard;
}

/** Employees' pension grades are the same list clipped to ¥88,000–¥650,000. */
export function pensionStandardRemuneration(annualSalary: number): number {
  const { min, max } = PENSION_STANDARD_REMUNERATION_RANGE;
  return Math.min(max, Math.max(min, healthStandardRemuneration(annualSalary)));
}

export interface SocialInsuranceInput {
  annualSalary: number;
  age: number;
  prefectureId: string;
  /** Enrolled in health insurance and employees' pension. */
  enrolled: boolean;
  employmentInsurance: boolean;
}

export interface SocialInsuranceResult {
  healthStandardRemuneration: number;
  pensionStandardRemuneration: number;
  /** Combined health, child support levy and (age 40–64) care insurance, employee share, per month. */
  healthMonthly: number;
  pensionMonthly: number;
  employmentMonthly: number;
  healthAnnual: number;
  pensionAnnual: number;
  employmentAnnual: number;
  careApplies: boolean;
  /** Health insurance rate used, total (employer + employee), in basis points. */
  healthRateBp: number;
  total: number;
}

/**
 * Employee-side social insurance, monthly shares rounded as payroll does, annual = 12 × monthly.
 * Health, the child support levy and care insurance are summed before rounding the half-share; the
 * published table lists them separately, so a payroll that rounds each line can differ by ¥1 a month.
 */
export function calculateSocialInsurance(input: SocialInsuranceInput): SocialInsuranceResult {
  const prefecture = PREFECTURES.find((p) => p.id === input.prefectureId);
  if (!prefecture) throw new Error(`Unknown prefecture: ${input.prefectureId}`);
  const rates = SOCIAL_INSURANCE_RATES;
  const careApplies = input.age >= rates.careFromAge && input.age <= rates.careUntilAge;
  const healthRateBp =
    prefecture.healthTotalBp + rates.childSupportTotalBp + (careApplies ? rates.careTotalBp : 0);

  const healthStandard = healthStandardRemuneration(input.annualSalary);
  const pensionStandard = pensionStandardRemuneration(input.annualSalary);
  const healthMonthly = input.enrolled ? roundHalfDown(healthStandard * healthRateBp, 20_000) : 0;
  const pensionMonthly = input.enrolled
    ? roundHalfDown(pensionStandard * rates.pensionTotalBp, 20_000)
    : 0;
  // Pay per month is annual / 12, so premium = annual × bp / (12 × 10,000).
  const employmentMonthly = input.employmentInsurance
    ? roundHalfDown(input.annualSalary * rates.employmentInsuranceEmployeeBp, 120_000)
    : 0;

  const healthAnnual = healthMonthly * 12;
  const pensionAnnual = pensionMonthly * 12;
  const employmentAnnual = employmentMonthly * 12;
  return {
    healthStandardRemuneration: healthStandard,
    pensionStandardRemuneration: pensionStandard,
    healthMonthly,
    pensionMonthly,
    employmentMonthly,
    healthAnnual,
    pensionAnnual,
    employmentAnnual,
    careApplies,
    healthRateBp,
    total: healthAnnual + pensionAnnual + employmentAnnual,
  };
}

export type PayrollError =
  'salary-invalid' | 'salary-too-large' | 'age-invalid' | 'insurance-exceeds-pay';

export const PAYROLL_ERROR_MESSAGES: Record<PayrollError, string> = {
  'salary-invalid': 'Enter your salary in yen as a whole number, such as 300000.',
  'salary-too-large': 'That salary is too large to calculate.',
  'age-invalid': `Enter an age from ${MIN_AGE} to ${MAX_AGE}. Insurance rules change at 65, 70 and 75, which this estimate does not cover.`,
  'insurance-exceeds-pay':
    'At this salary the insurance premiums would be more than the pay. Switch off social insurance (for example if you are a day student or below the enrolment conditions) and try again.',
};

export type PayrollInput = SocialInsuranceInput;

/**
 * How resident tax is represented. Resident tax billed in a year is generally based on the PREVIOUS year's
 * income, so a calculator that only knows one salary cannot reproduce the bill for a given year. This model is
 * a steady-state estimate: it applies the 令和9年度 rules (income earned in 2026) to the entered income, as if
 * the same income had also been earned the year before. It is not a payroll of the current year's actual bill.
 */
export type ResidentTaxModel = 'steady-state';

export interface PayrollResult {
  ruleYearLabel: string;
  residentTaxModel: ResidentTaxModel;
  annualSalary: number;
  socialInsurance: SocialInsuranceResult;
  taxes: TaxesResult;
  incomeTaxAnnual: number;
  residentTaxAnnual: number;
  totalDeductionsAnnual: number;
  takeHomeAnnual: number;
  /** Monthly figures are the annual figures ÷ 12 rounded to the yen (insurance is already monthly). */
  monthly: {
    gross: number;
    health: number;
    pension: number;
    employment: number;
    incomeTax: number;
    residentTax: number;
    totalDeductions: number;
    takeHome: number;
  };
}

export type PayrollOutcome =
  { ok: true; value: PayrollResult } | { ok: false; error: PayrollError };

export function calculatePayroll(input: PayrollInput): PayrollOutcome {
  const { annualSalary, age } = input;
  if (!Number.isInteger(annualSalary) || annualSalary < 0) {
    return { ok: false, error: 'salary-invalid' };
  }
  if (annualSalary > MAX_ANNUAL_SALARY) return { ok: false, error: 'salary-too-large' };
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    return { ok: false, error: 'age-invalid' };
  }
  const socialInsurance = calculateSocialInsurance(input);
  if (socialInsurance.total > annualSalary) return { ok: false, error: 'insurance-exceeds-pay' };

  const taxes = computeTaxes({
    salary: annualSalary,
    socialInsuranceDeduction: socialInsurance.total,
  });
  const incomeTaxAnnual = taxes.incomeTax.total;
  const residentTaxAnnual = taxes.residentTax.total;
  const totalDeductionsAnnual = socialInsurance.total + incomeTaxAnnual + residentTaxAnnual;
  const takeHomeAnnual = annualSalary - totalDeductionsAnnual;
  const perMonth = (annual: number) => Math.round(annual / 12);
  return {
    ok: true,
    value: {
      ruleYearLabel: JAPAN_MONEY_RULE_YEAR_LABEL,
      residentTaxModel: 'steady-state',
      annualSalary,
      socialInsurance,
      taxes,
      incomeTaxAnnual,
      residentTaxAnnual,
      totalDeductionsAnnual,
      takeHomeAnnual,
      monthly: {
        gross: perMonth(annualSalary),
        health: socialInsurance.healthMonthly,
        pension: socialInsurance.pensionMonthly,
        employment: socialInsurance.employmentMonthly,
        incomeTax: perMonth(incomeTaxAnnual),
        residentTax: perMonth(residentTaxAnnual),
        totalDeductions: perMonth(totalDeductionsAnnual),
        takeHome: perMonth(takeHomeAnnual),
      },
    },
  };
}

/** Whole-yen parser for salary-style inputs: allows commas, spaces and a ¥ sign, rejects decimals. */
export function parseWholeYen(text: string): number | undefined {
  const cleaned = text.replace(/[,\s¥￥円]/g, '');
  if (!/^\d+$/.test(cleaned)) return undefined;
  const value = Number(cleaned);
  return Number.isSafeInteger(value) ? value : undefined;
}
