import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>To read a timestamp: enter it, choose seconds or milliseconds, and select "Convert".</li>
      <li>To get a timestamp from a date: enter a date and time (UTC) and select "Convert".</li>
      <li>Use "Use current time" to fill in the timestamp for right now.</li>
    </ol>
  ),
  about: (
    <p>
      A Unix timestamp counts time as seconds (or milliseconds) since 1 January 1970, 00:00:00 UTC —
      the "epoch". Many systems and APIs use it because it is unambiguous and easy to compare. This
      tool converts it to your local time and to UTC, and back again.
    </p>
  ),
  faq: [
    {
      question: 'Seconds or milliseconds — which one do I have?',
      answer: (
        <p>
          A 10-digit timestamp (around 1–2 billion) is usually seconds; a 13-digit one is usually
          milliseconds. If the result looks wrong, try switching the unit.
        </p>
      ),
    },
    {
      question: 'Why is the "date to timestamp" field labelled UTC?',
      answer: (
        <p>
          To avoid ambiguity about which timezone you meant. Enter the date and time as UTC, and
          Toolora will not silently reinterpret it in your local timezone.
        </p>
      ),
    },
    {
      question: 'Can I convert a date before 1970?',
      answer: <p>Yes — negative timestamps represent dates before the Unix epoch.</p>,
    },
  ],
};
