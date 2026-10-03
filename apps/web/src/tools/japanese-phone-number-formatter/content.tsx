import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>
        Type or paste a number: with or without hyphens, spaces, parentheses, full-width digits, or
        +81.
      </li>
      <li>Select "Format".</li>
      <li>Copy the domestic or international form.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        The tool keeps the digits of the number and regroups them with hyphens when the pattern is
        well known: mobile (090, 080, 070), IP phone (050), toll-free (0120, 0800), navi-dial
        (0570), Tokyo (03) and Osaka (06) landlines, and a few large-city area codes. +81 and 0081
        numbers are converted to the domestic form, and the +81 form is shown without the leading 0.
      </p>
      <p>
        Japanese area codes range from two to five digits, so many landline numbers cannot be
        grouped reliably without a full table. For those the digits are shown as they are, without
        hyphens, rather than guessed. This is formatting only: the tool cannot tell whether a number
        is assigned, in service, or belongs to any person or business, and it makes no lookup.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Does a formatted number mean it is a real, working number?',
      answer: <p>No. Only the digits and their grouping are handled; nothing is verified.</p>,
    },
    {
      question: 'Why is my landline not hyphenated?',
      answer: (
        <p>
          The area code could not be determined confidently from the digits alone, so the digits are
          kept unchanged instead of risking a wrong grouping.
        </p>
      ),
    },
    {
      question: 'Is the number sent anywhere?',
      answer: <p>No. Formatting runs entirely in your browser.</p>,
    },
  ],
};
