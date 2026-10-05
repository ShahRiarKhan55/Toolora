import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>
        Enter a date and a time as they read in the "From" time zone, or use the current time.
      </li>
      <li>Choose the From and To time zones. Common ones are listed first.</li>
      <li>The converted time appears with both zones' offsets. Swap reverses the two zones.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        Time zones are identified by IANA names such as <code>Asia/Tokyo</code> or{' '}
        <code>America/New_York</code>. Conversions use the time zone data built into your browser
        (the <code>Intl</code> API), so daylight saving changes are applied for the date you enter
        rather than from a fixed offset table, and nothing is sent to a server.
      </p>
      <p>
        On the day clocks go forward, some local times do not exist and are reported as such. On the
        day clocks go back, a local time can occur twice; the earlier one is used and flagged.
        Results are only as accurate as your browser's time zone database, which may not reflect
        every historical rule change, so check carefully for dates far in the past.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why does a time say it does not exist?',
      answer: (
        <p>
          When daylight saving starts, clocks jump forward, for example from 02:00 straight to
          03:00. The skipped times never happen on a wall clock.
        </p>
      ),
    },
    {
      question: 'Which time zones are available?',
      answer: <p>Every IANA zone your browser supports, plus UTC.</p>,
    },
  ],
};
