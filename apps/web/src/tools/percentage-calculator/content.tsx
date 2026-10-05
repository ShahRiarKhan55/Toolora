import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Pick the question you want answered.</li>
      <li>Fill in the two values. The labels change to match the question.</li>
      <li>Select Calculate, then copy the result if you need it elsewhere.</li>
    </ol>
  ),
  about: (
    <>
      <p>The four calculations cover most everyday percentage questions:</p>
      <ul>
        <li>
          <strong>X% of Y</strong>: Y × X ÷ 100. A 15% tip on 80 is 12.
        </li>
        <li>
          <strong>X is what percent of Y</strong>: X ÷ Y × 100. 25 out of 200 is 12.5%.
        </li>
        <li>
          <strong>Percentage change</strong>: (new − old) ÷ |old| × 100. From 50 to 75 is a 50%
          increase; from 200 to 150 is a 25% decrease.
        </li>
        <li>
          <strong>Increase or decrease by a percentage</strong>: X × (1 ± Y ÷ 100). 200 increased by
          10% is 220.
        </li>
      </ul>
      <p>
        Decimals and negative numbers are accepted where the maths makes sense. Dividing by zero, or
        measuring a change from zero, has no answer, so you get a message instead. For marks and
        grades, see the Percentage / Grade Calculator.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why is a 50% increase followed by a 50% decrease not back to the start?',
      answer: (
        <p>
          The second percentage is taken of the new, larger number. 100 + 50% = 150, and 150 − 50% =
          75, which is 25% below where you started. Percentage changes do not cancel out.
        </p>
      ),
    },
    {
      question: 'Is my input sent anywhere?',
      answer: <p>No. The calculation happens in your browser.</p>,
    },
  ],
};
