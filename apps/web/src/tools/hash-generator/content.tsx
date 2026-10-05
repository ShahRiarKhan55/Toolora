import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Type or paste your text.</li>
      <li>The SHA-256, SHA-384 and SHA-512 hashes appear as you type.</li>
      <li>Copy the hash you need.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        A cryptographic hash turns any text into a fixed-length fingerprint. The same text always
        gives the same hash, and changing even one character gives a completely different one. It is
        how you check that a file or message has not changed, and a building block of digital
        signatures.
      </p>
      <p>
        The text is converted to UTF-8 bytes and hashed with your browser's built-in Web Crypto API
        (<code>crypto.subtle.digest</code>). The result is shown as lowercase hexadecimal: 64
        characters for SHA-256, 96 for SHA-384 and 128 for SHA-512. Only the SHA-2 family is offered
        on purpose; MD5 and SHA-1 are broken for security use.
      </p>
      <p>
        A plain hash is not a safe way to store passwords: use a purpose-built password hashing
        scheme (such as Argon2, scrypt or bcrypt) for that.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Is my text sent anywhere?',
      answer: (
        <p>
          No. Hashing runs in your browser through the Web Crypto API; nothing is uploaded or
          stored.
        </p>
      ),
    },
    {
      question: 'Why does my hash differ from the one I got elsewhere?',
      answer: (
        <p>
          Usually a hidden difference in the input: a trailing newline, Windows (CRLF) versus Unix
          (LF) line breaks, or a different character encoding. This tool hashes the exact UTF-8 text
          in the box.
        </p>
      ),
    },
    {
      question: 'Can I hash a file?',
      answer: <p>Not yet. This tool hashes text only.</p>,
    },
  ],
};
