import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Paste text (to escape) or text containing entities such as &amp;amp; (to decode).</li>
      <li>
        Select Encode or Decode. Tick the box to also write non-ASCII characters as numeric
        entities.
      </li>
      <li>Copy the result, or Clear to start again.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        HTML gives <code>&amp;</code>, <code>&lt;</code>, <code>&gt;</code> and quotes special
        meaning, so showing them literally in a page means writing them as entities:{' '}
        <code>&amp;amp;</code>, <code>&amp;lt;</code>, <code>&amp;gt;</code>,{' '}
        <code>&amp;quot;</code> and <code>&amp;#39;</code>. Escaping text before placing it in HTML
        is a basic defence against injection bugs.
      </p>
      <p>
        Decoding understands named entities (<code>&amp;copy;</code>) and numeric ones (
        <code>&amp;#169;</code>, <code>&amp;#xA9;</code>). The result is displayed as plain text and
        never inserted into the page as HTML, so pasting markup here cannot run anything.
      </p>
    </>
  ),
  faq: [
    {
      question: 'What counts as a malformed entity?',
      answer: (
        <p>
          Something shaped like <code>&amp;name;</code> that is not a real entity, or a numeric
          entity outside the Unicode range. A lone <code>&amp;</code> (as in AT&amp;T) is ordinary
          text and is kept.
        </p>
      ),
    },
    {
      question: 'Does decoding twice change the text again?',
      answer: (
        <p>
          Yes, one level per decode: <code>&amp;amp;lt;</code> becomes <code>&amp;lt;</code>, then{' '}
          <code>&lt;</code>.
        </p>
      ),
    },
  ],
};
