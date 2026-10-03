import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Pick a start date and an end date.</li>
      <li>Select "Calculate difference".</li>
      <li>
        Read the total days, the weeks-and-days split, and the years, months and days breakdown.
      </li>
    </ol>
  ),
  about: (
    <>
      <p>
        Dates are treated as plain calendar days with no time of day or time zone, so the result
        does not change with daylight saving or where you are. Leap years are included: 2024-01-01
        to 2025-01-01 is 366 days.
      </p>
      <p>
        The end date is not counted, so 1 January to 2 January is 1 day; add one yourself if you
        need both days counted. If the end is before the start, the dates are swapped and you are
        told. The years, months and days breakdown subtracts field by field and borrows the length
        of earlier months when needed (the same way the Japanese Age Calculator does), so it can
        differ from other tools for dates like the 31st.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why does 1 January to 2 January give 1 day?',
      answer: (
        <p>Because the difference counts the days between the dates, not both of the days.</p>
      ),
    },
    {
      question: 'Does it handle leap years?',
      answer: (
        <p>
          Yes. 29 February exists only in leap years, and invalid dates such as 29 February 2023 are
          rejected.
        </p>
      ),
    },
    {
      question: 'Are working days or holidays excluded?',
      answer: <p>No. This counts every calendar day, including weekends and holidays.</p>,
    },
  ],
};
