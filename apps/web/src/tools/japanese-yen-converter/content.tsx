import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Enter the amount in Japanese yen you want to convert.</li>
      <li>Choose the currency you want to convert it to.</li>
      <li>Check the reference rate shown, and edit it if you have a more current one.</li>
      <li>Select "Convert" to see the result, then copy it if you need it.</li>
    </ol>
  ),
  about: (
    <p>
      This converter uses reference exchange rates that are built into the page and can be edited by
      you — it does not call a live exchange-rate service. The rates are a reasonable starting
      point, not the current market rate, so always check a live source (like your bank) before
      relying on the result for anything financial.
    </p>
  ),
  faq: [
    {
      question: 'Are these live exchange rates?',
      answer: (
        <p>
          No. The rates are fixed reference values you can edit. Toolora does not call any
          exchange-rate API, so nothing here reflects the current market.
        </p>
      ),
    },
    {
      question: 'Can I use my own exchange rate?',
      answer: <p>Yes — edit the "Reference rate" field before converting.</p>,
    },
    {
      question: 'Is my data sent anywhere?',
      answer: <p>No. The conversion is calculated in your browser and never leaves it.</p>,
    },
  ],
};
