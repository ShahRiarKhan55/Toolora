import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Type or paste your text.</li>
      <li>Choose a case from "Convert to"; the result updates as you type.</li>
      <li>Copy the result, or Clear to start again.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        The conversions are simple and predictable. <strong>Title Case</strong> capitalises every
        word (it does not apply language-specific rules for small words such as "of" or "the").{' '}
        <strong>Sentence case</strong> capitalises the first letter of the text and after a full
        stop, question mark, exclamation mark or line break.
      </p>
      <p>
        For <strong>camelCase</strong>, <strong>PascalCase</strong>, <strong>snake_case</strong> and{' '}
        <strong>kebab-case</strong>, words are runs of letters and digits; spaces, punctuation,
        underscores and hyphens separate them, and existing camelCase is split too (
        <code>HTTPServer</code> becomes <code>http_server</code>). Each line is converted on its own
        so line breaks survive. Accented and non-Latin letters are supported.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why are small words capitalised in Title Case?',
      answer: (
        <p>Style guides disagree, so the tool applies one rule everywhere instead of guessing.</p>
      ),
    },
    {
      question: 'Is my text uploaded?',
      answer: <p>No. Everything happens in your browser.</p>,
    },
  ],
};
