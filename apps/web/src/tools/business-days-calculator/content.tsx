import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Pick a start date and an end date.</li>
      <li>Choose whether the start and end dates themselves are counted.</li>
      <li>Select "Count business days" to see the business days and the calendar days counted.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        <strong>Weekends are excluded; public holidays are not included.</strong> Monday to Friday
        are business days; Saturday and Sunday are not. Holidays differ by country, region and
        employer, so subtract them yourself if they matter.
      </p>
      <p>
        Counting convention: with both dates included (the default, like Excel's{' '}
        <code>NETWORKDAYS</code>), Monday to Friday of one week is 5 business days. Untick the start
        or end date to leave it out; the same date with either box unticked counts as 0. If the end
        date is earlier than the start date, the two are swapped. "Calendar days counted" is every
        day in the counted range, weekdays and weekends together.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Does it know about public holidays?',
      answer: <p>No. Only weekends are excluded, and no holiday data is used.</p>,
    },
    {
      question: 'Is this the same as the date difference calculator?',
      answer: (
        <p>
          That tool measures the gap between two dates; this one counts only the Monday–Friday days
          in the range.
        </p>
      ),
    },
  ],
};
