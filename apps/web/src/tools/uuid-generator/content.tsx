import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Enter how many UUIDs you need (up to 100 at a time).</li>
      <li>Select "Generate".</li>
      <li>Copy one UUID, or "Copy all" to copy the whole list (one per line).</li>
    </ol>
  ),
  about: (
    <p>
      This generates random UUIDs (version 4), using your browser's cryptographically secure random
      number generator (<code>crypto.randomUUID</code> or <code>crypto.getRandomValues</code>) —
      never a predictable source like <code>Math.random</code>.
    </p>
  ),
  faq: [
    {
      question: 'What is a UUID v4?',
      answer: (
        <p>
          A 128-bit identifier that is effectively unique without any central coordination —
          commonly used as database keys, request IDs and file names. "v4" means it is built from
          random bits rather than a timestamp or hardware address.
        </p>
      ),
    },
    {
      question: 'Are these truly random?',
      answer: (
        <p>
          Yes — they use the Web Crypto API's cryptographically secure random number generator, not
          the plain, predictable <code>Math.random</code>.
        </p>
      ),
    },
  ],
};
