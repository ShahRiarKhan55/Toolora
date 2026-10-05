import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Enter the loan amount, the annual interest rate and the term.</li>
      <li>Choose how often you pay: monthly, biweekly or weekly.</li>
      <li>
        Select Calculate to see the payment, the total paid and the total interest. Open the yearly
        summary to see how much of each year goes to interest and principal.
      </li>
    </ol>
  ),
  about: (
    <>
      <p>
        This uses the standard fixed-rate amortization formula{' '}
        <code>payment = P × r / (1 − (1 + r)^−n)</code>, where <code>P</code> is the loan amount,{' '}
        <code>r</code> the interest rate per payment period (annual rate ÷ payments per year) and{' '}
        <code>n</code> the number of payments. A 0% loan is simply the amount divided by the number
        of payments.
      </p>
      <p>
        Assumptions: a fixed rate for the whole term, equal payments made at the end of each period,
        12, 26 or 52 payments a year, no fees, insurance, taxes or extra payments, and amounts
        rounded only for display. Lenders differ in how they round and count days, so this will not
        match a specific bank's figure exactly. It is a calculator, not financial advice.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why is a biweekly payment not half the monthly one?',
      answer: (
        <p>
          There are 26 biweekly payments a year but 12 monthly ones, and interest is calculated per
          period, so the numbers are close but not simply related.
        </p>
      ),
    },
    {
      question: 'Does the yearly summary add up to the totals?',
      answer: (
        <p>
          Yes: the interest column adds up to the total interest, the principal column to the loan
          amount, and the balance reaches zero after the last payment.
        </p>
      ),
    },
  ],
};
