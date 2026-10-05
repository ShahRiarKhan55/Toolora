import { Link } from 'react-router-dom';
import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Enter an amount. It starts at 10,000 yen to Bangladeshi taka.</li>
      <li>
        Pick the currency to convert from and the one to convert to, or choose a popular pair.
      </li>
      <li>Use “Swap” to reverse the direction; your amount stays as it is.</li>
      <li>Read the result, the rate and its date, then copy the summary if you need it.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        This converter supports JPY, BDT, USD, EUR, GBP, CNY, KRW, INR, AUD, CAD, SGD, THB, VND,
        PHP, IDR and MYR. The rates are daily reference exchange rates: they are published about
        once a day and the rate date is shown with every result. They are not real-time or live
        market rates, and they are not the rate a bank, card or transfer service will give you.
      </p>
      <p>
        Rates are loaded through Toolora’s own service from ExchangeRate-API, with a second public
        source as a backup; the result always says which one supplied it. Your amount never leaves
        your browser.
      </p>
      <p>
        Shortcuts for common routes: <Link to="/tools/jpy-to-bdt">JPY to BDT</Link> and{' '}
        <Link to="/tools/bdt-to-jpy">BDT to JPY</Link>.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Are these live exchange rates?',
      answer: (
        <p>
          No. They are daily reference rates, so they can lag the market during the day. Each result
          shows the rate date.
        </p>
      ),
    },
    {
      question: 'Why does my bank or transfer service give a different amount?',
      answer: (
        <p>
          Banks and remittance services add a margin to the exchange rate and often charge fees. Use
          this converter to get a sense of scale, then check the exact quote with your provider.
        </p>
      ),
    },
    {
      question: 'What does “Served from Toolora’s short-term cache” mean?',
      answer: (
        <p>
          To avoid asking the provider again and again, Toolora keeps recent rates for a short time.
          That only affects how the rate reached you; the rate date shows when the provider
          published it.
        </p>
      ),
    },
    {
      question: 'Is my amount sent anywhere?',
      answer: (
        <p>
          No. The conversion is calculated in your browser. Only the currency code is sent to
          Toolora to look up the rate.
        </p>
      ),
    },
  ],
};
