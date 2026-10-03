import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>
        Type or paste a postal code in any common form: 1000001, 100-0001, 〒100-0001 or full-width
        digits.
      </li>
      <li>Select "Format" to get the standard XXX-XXXX form.</li>
      <li>Copy the result.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        A Japanese postal code (郵便番号) has seven digits, normally written as three digits, a
        hyphen and four digits. This tool strips a leading 〒, converts full-width digits and hyphen
        variants, and puts the hyphen after the third digit. Input with letters, the wrong number of
        digits, or a hyphen in the wrong place is rejected with a reason.
      </p>
      <p>
        This is formatting only. It does not check whether the code is assigned to any area, and it
        does not look up or complete addresses; for that, use Japan Post's own postal code search.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Does a formatted result mean the postal code exists?',
      answer: (
        <p>
          No. Any seven digits are accepted, including combinations that are not in use. Only the
          format is checked.
        </p>
      ),
    },
    {
      question: 'Can it find an address from a postal code?',
      answer: <p>No. There is no address lookup, and nothing is sent to a server.</p>,
    },
    {
      question: 'Why was my code rejected?',
      answer: (
        <p>
          Check that there are exactly seven digits and that any hyphen or space comes after the
          third digit. Old five-digit codes are not supported.
        </p>
      ),
    },
  ],
};
