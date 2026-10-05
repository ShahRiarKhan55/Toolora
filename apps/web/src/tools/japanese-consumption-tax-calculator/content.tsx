import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Choose whether your amount already includes tax (税込) or not (税抜).</li>
      <li>Pick the 10% standard rate or the 8% reduced rate.</li>
      <li>Enter the amount in yen and select Calculate.</li>
      <li>Copy the pre-tax amount, the tax, or the tax-inclusive total.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        Japan's consumption tax (消費税) has two rates: a 10% standard rate and an 8% reduced rate,
        which applies to things like takeaway food and drink (not alcohol) and subscription
        newspapers. This calculator does the arithmetic for either rate, in either direction.
      </p>
      <p>
        With a tax-exclusive price, tax = price × rate and the total is price + tax. With a
        tax-inclusive price, tax = price × rate ÷ (100 + rate), and the pre-tax amount is what is
        left. The tax is rounded to a whole yen in the direction you choose, and the other figure
        follows from it, so pre-tax plus tax always equals the total. Calculation is exact; there
        are no floating-point artifacts.
      </p>
      <p>
        This is a simple calculator for the standard 8% and 10% rates. It does not cover exemptions,
        special cases, the qualified invoice system (インボイス制度) or business accounting, and it
        is not legal, tax or accounting advice.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why does my receipt differ by a yen?',
      answer: (
        <p>
          Businesses round consumption tax per invoice (or per item) and may round down, to nearest
          or up. Try the other rounding options, and trust the receipt where they differ.
        </p>
      ),
    },
    {
      question: 'Which items use the 8% rate?',
      answer: (
        <p>
          Generally food and non-alcoholic drinks bought to take away, and subscription newspapers.
          Eating in at a restaurant is 10%. If unsure, ask the shop or check the National Tax
          Agency's guidance.
        </p>
      ),
    },
    {
      question: 'Is my amount sent anywhere?',
      answer: <p>No. The calculation happens in your browser.</p>,
    },
  ],
};
