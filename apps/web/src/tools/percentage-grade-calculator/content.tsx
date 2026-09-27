import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>
        Choose a calculation: percentage from marks, marks from a percentage, or percentage change.
      </li>
      <li>Fill in the fields shown for that calculation.</li>
      <li>Select "Calculate" to see the result — and a letter grade, where one applies.</li>
    </ol>
  ),
  about: (
    <p>
      This tool covers the everyday percentage calculations for coursework: turning marks into a
      percentage (or back again), and working out how much a value changed by. The letter grade uses
      a standard scale (A ≥ 90%, B ≥ 80%, C ≥ 70%, D ≥ 60%, otherwise F) — check your own
      institution's scale if it differs.
    </p>
  ),
  faq: [
    {
      question: 'Can marks obtained be more than the total?',
      answer: (
        <p>Yes — this is allowed for extra-credit scenarios and gives a percentage above 100%.</p>
      ),
    },
    {
      question: 'How is percentage change calculated?',
      answer: <p>(Ending value − starting value) ÷ |starting value| × 100.</p>,
    },
    {
      question: 'Does the grade scale match my school?',
      answer: (
        <p>
          It uses a common default scale. If your institution grades differently, use the percentage
          result and apply your own scale.
        </p>
      ),
    },
  ],
};
