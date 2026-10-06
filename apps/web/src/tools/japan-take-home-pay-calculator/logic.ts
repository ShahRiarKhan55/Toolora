import { DEFAULT_PREFECTURE_ID, PREFECTURES } from '../../config/japanMoneyRules';
import { calculatePayroll, parseWholeYen } from '../../lib/japanPayroll';
import type { PayrollError, PayrollResult } from '../../lib/japanPayroll';

export type SalaryBasis = 'monthly' | 'annual';

export interface TakeHomeInput {
  salary: string;
  basis: SalaryBasis;
  age: string;
  prefectureId: string;
  socialInsurance: boolean;
  employmentInsurance: boolean;
}

export const DEFAULT_TAKE_HOME_INPUT: TakeHomeInput = {
  salary: '',
  basis: 'monthly',
  age: '30',
  prefectureId: DEFAULT_PREFECTURE_ID,
  socialInsurance: true,
  employmentInsurance: true,
};

export type TakeHomeError = PayrollError | 'salary-empty' | 'age-empty' | 'prefecture-unknown';

export const TAKE_HOME_ERROR_MESSAGES: Record<TakeHomeError, string> = {
  'salary-empty': 'Enter your salary before deductions, in yen.',
  'age-empty': 'Enter your age.',
  'prefecture-unknown': 'Choose the prefecture of your health insurance.',
  'salary-invalid': 'Enter your salary in yen as a whole number, such as 300000.',
  'salary-too-large': 'That salary is too large to calculate.',
  'age-invalid':
    'Enter an age from 18 to 64. Insurance rules change at 65, 70 and 75, which this estimate does not cover.',
  'insurance-exceeds-pay':
    'At this salary the insurance premiums would be more than the pay. Switch off social insurance (for example if you are a day student or below the enrolment conditions) and try again.',
};

export type TakeHomeOutcome =
  { ok: true; value: PayrollResult } | { ok: false; error: TakeHomeError };

/** Turns the form's text into a payroll estimate. A monthly salary is taken as 12 equal payments. */
export function estimateTakeHome(input: TakeHomeInput): TakeHomeOutcome {
  if (input.salary.trim() === '') return { ok: false, error: 'salary-empty' };
  if (input.age.trim() === '') return { ok: false, error: 'age-empty' };
  if (!PREFECTURES.some((p) => p.id === input.prefectureId)) {
    return { ok: false, error: 'prefecture-unknown' };
  }
  const entered = parseWholeYen(input.salary);
  if (entered === undefined) return { ok: false, error: 'salary-invalid' };
  const age = /^\d+$/.test(input.age.trim()) ? Number(input.age.trim()) : Number.NaN;
  return calculatePayroll({
    annualSalary: input.basis === 'monthly' ? entered * 12 : entered,
    age,
    prefectureId: input.prefectureId,
    enrolled: input.socialInsurance,
    employmentInsurance: input.employmentInsurance,
  });
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('en-US')}`;
}

/** Plain-text summary for the copy button. */
export function summarize(result: PayrollResult): string {
  return [
    `Estimated take-home pay (${result.ruleYearLabel} rules): ${formatYen(result.monthly.takeHome)} a month, ${formatYen(result.takeHomeAnnual)} a year.`,
    `Salary before deductions: ${formatYen(result.monthly.gross)} a month, ${formatYen(result.annualSalary)} a year.`,
    'Resident tax is a steady-state estimate from the entered income; the actual bill reflects the previous year and can differ.',
    'An estimate from Toolora, not an official calculation.',
  ].join('\n');
}
