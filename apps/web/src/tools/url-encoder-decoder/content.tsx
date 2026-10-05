import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Type or paste text (to encode) or a percent-encoded string (to decode).</li>
      <li>Select Encode or Decode.</li>
      <li>Copy the result, or Clear to start again.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        URLs can only contain a limited set of characters, so everything else is written as a
        percent sign and two hex digits per UTF-8 byte: a space becomes <code>%20</code> and 日
        becomes <code>%E6%97%A5</code>. This tool uses the browser's own{' '}
        <code>encodeURIComponent</code> and <code>decodeURIComponent</code>.
      </p>
      <p>
        That is <em>component</em> encoding: it also escapes <code>/ ? &amp; = # :</code>, which is
        what you want for a single query value or path segment but not for a complete URL, where
        those characters have meaning. Decoding does not turn <code>+</code> into a space; that is a
        form-encoding convention, not part of percent-encoding.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why does decoding say my text is not valid?',
      answer: (
        <p>
          A <code>%</code> must be followed by two hex digits, and the bytes must form valid UTF-8.
          Text such as <code>100%</code> or <code>%E6%97</code> is rejected rather than guessed at.
        </p>
      ),
    },
    {
      question: 'Is my text sent anywhere?',
      answer: <p>No. Encoding and decoding happen in your browser.</p>,
    },
  ],
};
