import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Choose "Text → Base64" or "Base64 → Text".</li>
      <li>Type or paste your input.</li>
      <li>Select the action button, then copy the result — or "Swap" to convert it back.</li>
    </ol>
  ),
  about: (
    <p>
      Base64 is a way of representing binary data (or any text) as plain ASCII characters. This tool
      encodes and decodes correctly for any Unicode text — including Japanese, accented characters
      and emoji — by converting through UTF-8 bytes rather than relying on the browser's raw
      <code>btoa</code>/<code>atob</code>, which only handle Latin-1 text correctly.
    </p>
  ),
  faq: [
    {
      question: 'Why did my Base64 decode incorrectly elsewhere but work here?',
      answer: (
        <p>
          A plain <code>atob()</code> call corrupts non-Latin1 characters. This tool decodes the
          bytes as UTF-8 instead, so Unicode text round-trips correctly.
        </p>
      ),
    },
    {
      question: 'What happens if I paste invalid Base64?',
      answer: <p>You will see a clear error instead of garbled or silently wrong output.</p>,
    },
  ],
};
