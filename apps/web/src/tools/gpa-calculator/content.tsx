import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Enter each course's name (optional), credits and grade.</li>
      <li>Use "Add course" for more rows, or "Remove" to delete one.</li>
      <li>Select "Calculate GPA" to see your credit-weighted GPA.</li>
    </ol>
  ),
  about: (
    <p>
      Toolora calculates a credit-weighted grade point average using a standard 4.0 scale (A = 4.0
      down to F = 0.0, with +/- steps). Institutions vary in exactly how they weight grades, so
      treat this as a general-purpose estimate rather than an official transcript calculation.
    </p>
  ),
  faq: [
    {
      question: 'How is GPA calculated?',
      answer: (
        <p>
          Each course's credits are multiplied by its grade's point value, those products are
          summed, and the total is divided by the sum of all credits.
        </p>
      ),
    },
    {
      question: 'Can I use a different grading scale than mine?',
      answer: (
        <p>
          Toolora currently uses one standard 4.0 scale for every course. If your institution grades
          differently, treat the result as an approximation.
        </p>
      ),
    },
    {
      question: 'What happens with zero-credit courses?',
      answer: <p>They are allowed (e.g. an audited course) but do not affect the GPA.</p>,
    },
  ],
};
