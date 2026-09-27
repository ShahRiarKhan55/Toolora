import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>To find an era from a date: pick a Gregorian date and select "Convert to era".</li>
      <li>
        To find a Gregorian year from an era: choose an era, enter its year, and select "Convert to
        Gregorian".
      </li>
      <li>A note appears when the requested year only partly overlaps an era.</li>
    </ol>
  ),
  about: (
    <p>
      Japan names years by the reigning emperor's era (元号, gengō) as well as the Gregorian
      calendar — for example, 2024 is also Reiwa 6. This tool supports the five modern eras: Meiji,
      Taisho, Showa, Heisei and Reiwa, using their official start and end dates. Dates before Meiji
      (23 October 1868) are outside what this tool supports.
    </p>
  ),
  faq: [
    {
      question: 'Why is Showa 64 only a few days long?',
      answer: (
        <p>
          Emperor Showa died on 7 January 1989, so Showa 64 covers only 1–7 January 1989 before
          Heisei began on 8 January. The same applies to the first and last year of every era.
        </p>
      ),
    },
    {
      question: 'What happens after Reiwa?',
      answer: (
        <p>
          Reiwa has no announced end date, so every date from 1 May 2019 onward converts to a Reiwa
          year, however far in the future.
        </p>
      ),
    },
    {
      question: 'Can I convert dates from before Meiji?',
      answer: <p>Not yet — Toolora currently supports Meiji (1868) onward.</p>,
    },
  ],
};
