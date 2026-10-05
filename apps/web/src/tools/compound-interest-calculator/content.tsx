import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Enter the starting amount, the annual interest rate and the time period.</li>
      <li>Choose how often the interest is compounded.</li>
      <li>
        Select Calculate. Optionally pick a currency label; it only changes how amounts are shown.
      </li>
    </ol>
  ),
  about: (
    <>
      <p>
        With compound interest, earned interest is added to the balance and then earns interest
        itself. The calculator uses the standard formula <code>A = P × (1 + r/n)^(n×t)</code>, where{' '}
        <code>P</code> is the principal, <code>r</code> the annual rate as a fraction,{' '}
        <code>n</code> the number of compounding periods per year and <code>t</code> the time in
        years.
      </p>
      <p>
        Assumptions: the rate is fixed for the whole period, interest is credited at the end of each
        compounding period, daily compounding uses 365 periods a year, and there are no deposits,
        withdrawals, fees or taxes. Amounts are rounded only for display. Real accounts differ in
        how they round and credit interest, so treat the figures as an estimate.
      </p>
      <p>
        This is a calculator, not financial advice, and it does not predict or promise any
        investment return.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why does more frequent compounding give a little more?',
      answer: (
        <p>
          Interest starts earning interest sooner. The gain shrinks as frequency rises: daily is
          only slightly above monthly.
        </p>
      ),
    },
    {
      question: 'Are exchange rates used when I pick a currency?',
      answer: <p>No. The currency choice only labels the numbers; nothing is converted.</p>,
    },
  ],
};
