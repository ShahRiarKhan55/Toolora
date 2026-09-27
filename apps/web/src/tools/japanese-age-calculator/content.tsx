import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Enter a date of birth.</li>
      <li>Optionally change the reference date — it defaults to today.</li>
      <li>Select "Calculate age" to see the exact age and the next birthday.</li>
    </ol>
  ),
  about: (
    <p>
      This calculator counts full years, months and days between two dates, plus the total number of
      days lived and when the next birthday falls. A birthday on 29 February is observed on 28
      February in years that are not leap years. This tool does not apply any legal age rule — it
      only reports elapsed time.
    </p>
  ),
  faq: [
    {
      question: 'What happens with a 29 February birthday?',
      answer: (
        <p>
          In a non-leap year, the birthday is shown as observed on 28 February. In a leap year, it
          is shown on the real date, 29 February.
        </p>
      ),
    },
    {
      question: 'Can I calculate age on a date other than today?',
      answer: <p>Yes — change the "Reference date" field before calculating.</p>,
    },
    {
      question: 'What happens if I enter a future date of birth?',
      answer: (
        <p>Toolora shows a validation error: a birth date cannot be after the reference date.</p>
      ),
    },
  ],
};
