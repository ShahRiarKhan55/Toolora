import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Enter your yearly salary for 2026 before deductions, your age and your prefecture.</li>
      <li>Add a spouse, dependants and other deductions only if they apply to you.</li>
      <li>Select Estimate limit, then read the approximate upper limit and how it was reached.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        Furusato nozei (ふるさと納税) lets you donate to a municipality and claim most of the amount
        back as a deduction, apart from ¥2,000. The deduction has a ceiling that depends on your
        income. This estimator works out an approximate ceiling for an employee using the formulas
        the Ministry of Internal Affairs and Communications publishes.
      </p>
      <p>
        The ceiling comes from the resident tax. The special deduction is capped at 20% of your
        resident income tax, and its rate is 90% minus your income tax rate times 1.021, where the
        rate is found from your taxable income after your deductions. So the limit is the resident
        income tax times 20%, divided by that rate, plus ¥2,000. The estimator derives your taxable
        incomes from your salary, social insurance, the 2026 deductions and any household items you
        enter, so you can see each step under "How this estimate was reached".
      </p>
      <p>
        It is an estimate: your real limit depends on your final tax situation and deductions, and
        donating more than the limit does not give the same benefit. It covers employees with salary
        income only. See "Sources and assumptions" for what each number is based on. It is not tax
        advice and not an official calculation.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why is my limit different from another calculator?',
      answer: (
        <p>
          Calculators differ in how they treat insurance premiums, dependants and deductions, and
          many still use pre-2026 rules. This one follows the 2026 rules and shows its working. Your
          municipality's tax simulator, using your real figures, is the best check.
        </p>
      ),
    },
    {
      question: 'What happens if I donate more than the limit?',
      answer: (
        <p>
          The amount above the limit is a plain donation with no tax deduction, so you would pay
          more than ¥2,000 yourself. The estimate is the point up to which the full deduction
          applies.
        </p>
      ),
    },
    {
      question: 'Is my salary sent anywhere?',
      answer: <p>No. The estimate runs in your browser and nothing you type is sent or stored.</p>,
    },
  ],
};
