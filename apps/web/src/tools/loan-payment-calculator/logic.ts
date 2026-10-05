import { MAX_CURRENCY_AMOUNT } from '@toolora/shared';
import { parseDecimal } from '../../lib/parseDecimal';

export const FREQUENCY_OPTIONS = [
  { id: 'monthly', label: 'Monthly', perYear: 12 },
  { id: 'biweekly', label: 'Biweekly (every 2 weeks)', perYear: 26 },
  { id: 'weekly', label: 'Weekly', perYear: 52 },
] as const;

export type FrequencyId = (typeof FREQUENCY_OPTIONS)[number]['id'];
export type TermUnit = 'years' | 'months';

export const MAX_RATE_PERCENT = 100;
export const MAX_TERM_YEARS = 100;

export type LoanError =
  | 'invalid-amount'
  | 'amount-too-large'
  | 'invalid-rate'
  | 'invalid-term'
  | 'term-too-long'
  | 'term-too-short';

export const LOAN_ERROR_MESSAGES: Record<LoanError, string> = {
  'invalid-amount': 'Enter a loan amount greater than 0.',
  'amount-too-large': 'That loan amount is too large to calculate.',
  'invalid-rate': `Enter an annual interest rate from 0 to ${MAX_RATE_PERCENT}%.`,
  'invalid-term': 'Enter a loan term greater than 0.',
  'term-too-long': `Use a loan term of ${MAX_TERM_YEARS} years or less.`,
  'term-too-short': 'That term is shorter than one payment period.',
};

export interface LoanInput {
  amount: string;
  ratePercent: string;
  term: string;
  termUnit: TermUnit;
  frequency: FrequencyId;
}

export interface YearSummary {
  year: number;
  interest: number;
  principal: number;
  /** Balance left after the last payment of that year. */
  balance: number;
}

export interface LoanResult {
  payment: number;
  paymentCount: number;
  totalPaid: number;
  totalInterest: number;
  years: readonly YearSummary[];
}

/**
 * Standard fixed-rate amortization: payment = P·r / (1 − (1 + r)^−n) with r the rate per payment
 * period and n the number of payments; a 0% loan is simply P / n. Payments are made at the end of
 * each period, and interest accrues per period (rate ÷ periods a year) — banks differ in details.
 */
export function calculateLoan(
  input: LoanInput,
): { ok: true; value: LoanResult } | { ok: false; error: LoanError } {
  const amount = parseDecimal(input.amount);
  if (amount === undefined || amount <= 0) return { ok: false, error: 'invalid-amount' };
  if (amount > MAX_CURRENCY_AMOUNT) return { ok: false, error: 'amount-too-large' };

  const ratePercent = parseDecimal(input.ratePercent);
  if (ratePercent === undefined || ratePercent < 0 || ratePercent > MAX_RATE_PERCENT) {
    return { ok: false, error: 'invalid-rate' };
  }

  const term = parseDecimal(input.term);
  if (term === undefined || term <= 0) return { ok: false, error: 'invalid-term' };
  const termYears = input.termUnit === 'months' ? term / 12 : term;
  if (termYears > MAX_TERM_YEARS) return { ok: false, error: 'term-too-long' };

  const perYear = FREQUENCY_OPTIONS.find((o) => o.id === input.frequency)!.perYear;
  const paymentCount = Math.round(termYears * perYear);
  if (paymentCount < 1) return { ok: false, error: 'term-too-short' };

  const r = ratePercent / 100 / perYear;
  const payment =
    r === 0 ? amount / paymentCount : (amount * r) / (1 - Math.pow(1 + r, -paymentCount));

  const years: YearSummary[] = [];
  let balance = amount;
  let interestInYear = 0;
  let principalInYear = 0;
  for (let i = 1; i <= paymentCount; i++) {
    const interest = balance * r;
    const principal = payment - interest;
    balance -= principal;
    interestInYear += interest;
    principalInYear += principal;
    if (i % perYear === 0 || i === paymentCount) {
      // Floating-point drift can leave a hair below or above zero after the last payment.
      years.push({
        year: Math.ceil(i / perYear),
        interest: interestInYear,
        principal: principalInYear,
        balance: i === paymentCount ? 0 : Math.max(balance, 0),
      });
      interestInYear = 0;
      principalInYear = 0;
    }
  }

  const totalPaid = payment * paymentCount;
  return {
    ok: true,
    value: { payment, paymentCount, totalPaid, totalInterest: totalPaid - amount, years },
  };
}
