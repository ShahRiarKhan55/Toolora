import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Choose whether to convert a GPA to a percentage, or a percentage to a GPA.</li>
      <li>Pick the maximum of your GPA scale: 4.0, 5.0 or 10.</li>
      <li>Enter the value and select "Convert".</li>
    </ol>
  ),
  about: (
    <>
      <p>
        Toolora uses one simple, visible formula: a straight proportion. A GPA of 3.5 on a 4.0 scale
        is 3.5 ÷ 4 × 100 = 87.5%, and the reverse is percentage ÷ 100 × the scale maximum. Results
        are rounded to two decimals.
      </p>
      <p>
        There is no single correct way to convert between GPA and percentage. Universities,
        countries and credential evaluators publish their own tables; many are not proportional (for
        example, a 4.0 often corresponds to a band of percentages, not exactly 100%). Treat the
        result as a rough estimate, and use the conversion your institution or the receiving
        organization asks for when it matters.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Is this the conversion my university uses?',
      answer: (
        <p>
          Possibly not. This is a transparent estimate, not a published institutional rule. Check
          the conversion required by the school, employer or agency you are applying to.
        </p>
      ),
    },
    {
      question: 'Why can I not enter a GPA above the scale maximum?',
      answer: (
        <p>
          A GPA can only be between 0 and its scale's maximum, so anything above is rejected instead
          of producing a meaningless percentage.
        </p>
      ),
    },
    {
      question: 'Is my data sent anywhere?',
      answer: <p>No. The calculation runs in your browser.</p>,
    },
  ],
};
