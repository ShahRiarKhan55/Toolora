import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Choose whether you are entering a monthly or an annual salary, before deductions.</li>
      <li>Enter your age and the prefecture whose health insurance rate applies to you.</li>
      <li>Tick or clear the insurance assumptions, then select Calculate.</li>
      <li>Read the monthly and annual take-home pay and the line-by-line deductions.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        This Japan take-home pay calculator estimates what is left of a salary after the main
        deductions an employee in Japan pays: health insurance (including the child support levy
        and, from age 40, long-term care insurance), employees' pension, employment insurance,
        income tax with the 2.1% reconstruction tax, and resident tax. It uses the rules for income
        earned in 2026 (令和8年), including the higher employment income deduction and basic
        deduction that take effect on 1 December 2026.
      </p>
      <p>
        Insurance premiums are worked out from your monthly pay's standard remuneration grade, with
        the employee half rounded the way employers deduct it. Income tax and resident tax are taken
        on what remains after employment income deduction, insurance premiums and the basic
        deduction. Everything is whole-yen integer arithmetic, so there is no floating-point drift.
      </p>
      <p>
        It deliberately keeps to one situation: a single employee on equal monthly pay. Bonuses,
        spouses and dependants, the home loan deduction, iDeCo, medical and life-insurance
        deductions, company health societies, and local add-ons to resident tax are not modelled.
        See "Sources and assumptions" on this page for what each number is based on. It is not tax
        advice and not an official calculation.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why is my payslip different from this estimate?',
      answer: (
        <p>
          Payroll depends on your employer's insurer and rounding, your municipality's resident tax,
          your allowances and bonuses, your dependants, and deductions this tool leaves out.
          Resident tax is also generally based on the previous year's income, while this tool
          estimates it from the income you enter, so a first-year payslip can differ. Trust the
          payslip.
        </p>
      ),
    },
    {
      question: 'Why does the tool use 2026 rules?',
      answer: (
        <p>
          Japan's 2026 tax reform raised the minimum employment income deduction and the basic
          deduction, which lowers income tax compared with older calculators. The tool labels every
          result with its rules year so you can tell which year it describes.
        </p>
      ),
    },
    {
      question: 'Is my salary sent anywhere?',
      answer: (
        <p>
          No. The calculation runs in your browser and nothing you type is sent, saved or stored.
        </p>
      ),
    },
  ],
};
