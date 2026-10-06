import {
  DEFAULT_PREFECTURE_ID,
  FURUSATO,
  INCOME_TAX_BASIC_DEDUCTION_BASELINE,
  JAPAN_MONEY_RULE_YEAR_LABEL,
  PERSONAL_DEDUCTIONS,
  PREFECTURES,
  RESIDENT_TAX,
} from '../../config/japanMoneyRules';
import {
  MAX_ANNUAL_SALARY,
  MAX_AGE,
  MIN_AGE,
  calculateSocialInsurance,
  parseWholeYen,
} from '../../lib/japanPayroll';
import { computeTaxes, employmentIncome, intDiv } from '../../lib/japanTax';
import type { ExtraDeductions } from '../../lib/japanTax';

export type SpouseOption = 'none' | 'deduction';

export interface FurusatoInput {
  salary: string;
  age: string;
  prefectureId: string;
  spouse: SpouseOption;
  /** Dependants aged 16+ other than 19–22 (and under 70). */
  generalDependants: string;
  /** Dependants aged 19–22. */
  specificDependants: string;
  /** Other deductions you expect (e.g. iDeCo, medical), counted equally for income tax and resident tax. */
  otherDeductions: string;
}

export const DEFAULT_FURUSATO_INPUT: FurusatoInput = {
  salary: '',
  age: '30',
  prefectureId: DEFAULT_PREFECTURE_ID,
  spouse: 'none',
  generalDependants: '0',
  specificDependants: '0',
  otherDeductions: '0',
};

export type FurusatoError =
  | 'salary-empty'
  | 'salary-invalid'
  | 'salary-too-large'
  | 'age-empty'
  | 'age-invalid'
  | 'prefecture-unknown'
  | 'dependants-invalid'
  | 'other-invalid'
  | 'other-too-large';

export const FURUSATO_ERROR_MESSAGES: Record<FurusatoError, string> = {
  'salary-empty': 'Enter your yearly salary before deductions, in yen.',
  'salary-invalid': 'Enter your yearly salary in yen as a whole number, such as 5000000.',
  'salary-too-large': 'That salary is too large to calculate.',
  'age-empty': 'Enter your age.',
  'age-invalid':
    'Enter an age from 18 to 64. Insurance rules change at 65, 70 and 75, which this estimate does not cover.',
  'prefecture-unknown': 'Choose the prefecture of your health insurance.',
  'dependants-invalid': 'Enter the number of dependants as a whole number from 0 to 20.',
  'other-invalid': 'Enter other deductions in yen as a whole number, or 0.',
  'other-too-large': 'That deduction amount is too large.',
};

export type LimitBasis =
  /** The usual case: the 20% cap on the resident-tax special deduction. */
  | 'special-deduction-cap'
  /** No resident income tax is payable, so there is nothing for a donation to reduce. */
  | 'no-resident-income-tax';

export interface FurusatoResult {
  ruleYearLabel: string;
  annualSalary: number;
  employmentIncome: number;
  socialInsuranceAnnual: number;
  incomeTaxableIncome: number;
  residentTaxableIncome: number;
  /** Resident income levy (10% of taxable income less the adjustment credit), before donation deductions. */
  residentIncomeLevy: number;
  /** Income-tax rate (percent) behind the special deduction rate. */
  referenceRatePercent: number;
  /** 90% − (income tax rate × 1.021), in percent with 3 decimals, e.g. 84.895. */
  specialDeductionRatePercent: number;
  /** Estimated upper limit of the donation for the full deduction, in yen (0 when there is no benefit). */
  limit: number;
  basis: LimitBasis;
  selfBurden: number;
  /** Household items that were left out because the taxpayer's own income is too high for them. */
  notes: string[];
}

export type FurusatoOutcome =
  { ok: true; value: FurusatoResult } | { ok: false; error: FurusatoError };

function parseCount(text: string): number | undefined {
  const cleaned = text.trim();
  if (!/^\d+$/.test(cleaned)) return undefined;
  const value = Number(cleaned);
  return value <= 20 ? value : undefined;
}

/** Spouse deduction amounts for the taxpayer's own total income, if the spouse deduction is available at all. */
function spouseDeduction(taxpayerIncome: number) {
  return PERSONAL_DEDUCTIONS.spouse.find((bracket) => taxpayerIncome <= bracket.upTo);
}

function householdDeductions(
  input: { spouse: SpouseOption; general: number; specific: number },
  taxpayerIncome: number,
  notes: string[],
): ExtraDeductions {
  const { dependantGeneral, dependantSpecific } = PERSONAL_DEDUCTIONS;
  let incomeTax =
    input.general * dependantGeneral.incomeTax + input.specific * dependantSpecific.incomeTax;
  let resident =
    input.general * dependantGeneral.resident + input.specific * dependantSpecific.resident;
  let adjustmentDifference =
    input.general * dependantGeneral.difference + input.specific * dependantSpecific.difference;
  if (input.spouse === 'deduction') {
    const bracket = spouseDeduction(taxpayerIncome);
    if (bracket) {
      incomeTax += bracket.incomeTax;
      resident += bracket.resident;
      adjustmentDifference += bracket.difference;
    } else {
      notes.push(
        'The spouse deduction was left out: it is not available when your own total income is over ¥10,000,000.',
      );
    }
  }
  return { incomeTax, resident, adjustmentDifference };
}

/** Rate bracket (percent) for the special deduction, from Sakai City's published table (inclusive bounds). */
export function specialDeductionBracketRate(referenceTaxable: number): number {
  return (
    FURUSATO.rateBrackets.find((bracket) => referenceTaxable <= bracket.upTo)?.ratePercent ??
    FURUSATO.topRatePercent
  );
}

/**
 * Upper limit of a donation that still gets the full deduction (everything above the ¥2,000 self-borne
 * amount comes back), from the 総務省 formulas:
 *   special deduction = (donation − 2,000) × (90% − income tax rate × 1.021)
 *   capped at 20% of the resident income levy
 * so the limit is levy × 20% ÷ (90% − rate × 1.021) + 2,000, evaluated in integers and rounded down.
 */
export function donationLimit(levy: number, ratePercent: number): number {
  const denominator = FURUSATO.baseRatePercent * 1000 - ratePercent * 1021;
  return (
    intDiv(levy * FURUSATO.specialDeductionCapPercent * 1000, denominator) + FURUSATO.selfBurden
  );
}

export function estimateFurusatoLimit(input: FurusatoInput): FurusatoOutcome {
  if (input.salary.trim() === '') return { ok: false, error: 'salary-empty' };
  const salary = parseWholeYen(input.salary);
  if (salary === undefined) return { ok: false, error: 'salary-invalid' };
  if (salary > MAX_ANNUAL_SALARY) return { ok: false, error: 'salary-too-large' };
  if (input.age.trim() === '') return { ok: false, error: 'age-empty' };
  const age = /^\d+$/.test(input.age.trim()) ? Number(input.age.trim()) : Number.NaN;
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    return { ok: false, error: 'age-invalid' };
  }
  if (!PREFECTURES.some((p) => p.id === input.prefectureId)) {
    return { ok: false, error: 'prefecture-unknown' };
  }
  const general = parseCount(input.generalDependants);
  const specific = parseCount(input.specificDependants);
  if (general === undefined || specific === undefined)
    return { ok: false, error: 'dependants-invalid' };
  const other = parseWholeYen(input.otherDeductions.trim() === '' ? '0' : input.otherDeductions);
  if (other === undefined) return { ok: false, error: 'other-invalid' };
  if (other > MAX_ANNUAL_SALARY) return { ok: false, error: 'other-too-large' };

  // The estimate is for an employee enrolled in social insurance on 12 equal monthly payments.
  const insurance = calculateSocialInsurance({
    annualSalary: salary,
    age,
    prefectureId: input.prefectureId,
    enrolled: true,
    employmentInsurance: true,
  });
  const notes: string[] = [];
  const hasHousehold = input.spouse === 'deduction' || general > 0 || specific > 0;
  const extra = householdDeductions(
    { spouse: input.spouse, general, specific },
    employmentIncome(salary),
    notes,
  );
  const taxes = computeTaxes({
    salary,
    socialInsuranceDeduction: insurance.total,
    extra,
    otherDeductions: other,
    applyResidentExemption: !hasHousehold && other === 0,
  });

  const resident = taxes.residentTax;
  const totalIncome = taxes.employmentIncome;
  const basicDifference =
    totalIncome <= RESIDENT_TAX.adjustment.maxTotalIncome
      ? RESIDENT_TAX.adjustment.basicDifference
      : 0;
  const incomeTaxBasicExcess = Math.max(
    0,
    taxes.incomeTaxBasicDeduction - INCOME_TAX_BASIC_DEDUCTION_BASELINE,
  );
  const referenceTaxable = Math.max(
    0,
    resident.taxableIncome - basicDifference - extra.adjustmentDifference - incomeTaxBasicExcess,
  );
  const referenceRatePercent = specialDeductionBracketRate(referenceTaxable);
  const specialDeductionRatePercent =
    (FURUSATO.baseRatePercent * 1000 - referenceRatePercent * 1021) / 1000;

  const levy = resident.levyUnrounded;
  const common = {
    ruleYearLabel: JAPAN_MONEY_RULE_YEAR_LABEL,
    annualSalary: salary,
    employmentIncome: totalIncome,
    socialInsuranceAnnual: insurance.total,
    incomeTaxableIncome: taxes.incomeTax.taxableIncome,
    residentTaxableIncome: resident.taxableIncome,
    residentIncomeLevy: levy,
    referenceRatePercent,
    specialDeductionRatePercent,
    selfBurden: FURUSATO.selfBurden,
    notes,
  };
  if (levy <= 0) {
    return { ok: true, value: { ...common, limit: 0, basis: 'no-resident-income-tax' } };
  }
  // The 30%-of-income cap on counted donations never binds for an employee (the limit is a few percent of
  // taxable income) but is part of the rule, so it is applied.
  const incomeCap = intDiv(totalIncome * FURUSATO.donationCapPercentOfIncome, 100);
  const limit = Math.min(donationLimit(levy, referenceRatePercent), incomeCap);
  return { ok: true, value: { ...common, limit, basis: 'special-deduction-cap' } };
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('en-US')}`;
}

export function summarize(result: FurusatoResult): string {
  const head =
    result.limit > 0
      ? `Estimated furusato nozei limit (${result.ruleYearLabel} rules): about ${formatYen(result.limit)} for the year.`
      : `Estimated furusato nozei limit (${result.ruleYearLabel} rules): no resident income tax to reduce, so no deduction benefit.`;
  return [
    head,
    `You still bear ${formatYen(result.selfBurden)}, and donating more than the limit does not give the same benefit.`,
    'An estimate from Toolora, not an official calculation.',
  ].join('\n');
}
