import type { CurrencyCode } from '@toolora/shared';
import { CURRENCY_INFO } from '@toolora/shared';
import { Link } from 'react-router-dom';
import type { ToolContent } from '../types';

/**
 * Copy for one currency-pair page. Static text only: it never states a current rate, because the
 * live number comes from the converter above it. The worked example uses a round rate chosen for the
 * arithmetic and says so.
 */
function pairContent(
  from: CurrencyCode,
  to: CurrencyCode,
  illustrativeRate: number,
  reverse: { slug: string; label: string },
): ToolContent {
  const fromName = CURRENCY_INFO[from].name;
  const toName = CURRENCY_INFO[to].name;
  const example = (10_000 * illustrativeRate).toLocaleString('en-US');
  return {
    howToUse: (
      <ol>
        <li>
          The converter above is set to {from} → {to}. Enter the amount in {fromName}.
        </li>
        <li>The result shows the amount in {toName} and the rate it used.</li>
        <li>
          Use “Swap” for {to} → {from}, or pick any of the other supported currencies.
        </li>
      </ol>
    ),
    about: (
      <>
        <p>
          To convert {fromName} ({from}) to {toName} ({to}), Toolora takes the daily reference rate
          — how many {to} one {from} is worth — and multiplies it by your amount.
        </p>
        <p>
          Example, using an illustrative rate of 1 {from} = {illustrativeRate} {to} (a round number
          for the arithmetic, not a current rate): 10,000 {from} × {illustrativeRate} = {example}{' '}
          {to}. The converter does the same sum with the real rate.
        </p>
        <p>
          Reference rates are published about once a day, and the rate date is shown under every
          result. They are not live market rates, and banks and transfer services use their own
          rates and fees. The general <Link to="/tools/currency-converter">Currency Converter</Link>{' '}
          covers every supported pair, and you can also open{' '}
          <Link to={`/tools/${reverse.slug}`}>{reverse.label}</Link>.
        </p>
      </>
    ),
    faq: [
      {
        question: `What is the ${from} to ${to} rate today?`,
        answer: (
          <p>
            The converter above loads the latest daily reference rate and shows its date. Because
            the rate changes, this page does not print a fixed number.
          </p>
        ),
      },
      {
        question: `Is this the rate I will get when sending money from ${from} to ${to}?`,
        answer: (
          <p>
            Not necessarily. Banks and money-transfer services set their own rates and fees, so
            compare their quote with the reference rate here.
          </p>
        ),
      },
      {
        question: 'Why does the rate date matter?',
        answer: (
          <p>
            It tells you how fresh the reference rate is. A date that is a day or two old is normal
            around weekends and holidays.
          </p>
        ),
      },
    ],
  };
}

export const variantContent: Record<string, ToolContent> = {
  'jpy-to-bdt': pairContent('JPY', 'BDT', 0.8, { slug: 'bdt-to-jpy', label: 'BDT to JPY' }),
  'bdt-to-jpy': pairContent('BDT', 'JPY', 1.25, { slug: 'jpy-to-bdt', label: 'JPY to BDT' }),
};
