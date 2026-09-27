import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Paste your JSON into the input box (or select "Load example" to try one).</li>
      <li>Select "Format" for readable, indented JSON, or "Minify" to remove whitespace.</li>
      <li>Copy the result, or fix the reported error and try again.</li>
    </ol>
  ),
  about: (
    <p>
      This tool parses JSON with the browser's built-in, safe JSON parser — it never evaluates your
      input as JavaScript. Valid JSON is formatted or minified; invalid JSON shows the parser's
      error message so you can find the problem.
    </p>
  ),
  faq: [
    {
      question: 'Does this run any of my JSON as code?',
      answer: (
        <p>
          No. It is parsed with `JSON.parse`, which only ever produces data — never executes
          anything.
        </p>
      ),
    },
    {
      question: 'Why was my JSON rejected?',
      answer: (
        <p>
          Common causes are trailing commas, unquoted keys, or single quotes instead of double
          quotes — none of these are valid in standard JSON.
        </p>
      ),
    },
    {
      question: 'Is my JSON sent anywhere?',
      answer: <p>No. Parsing and formatting happen entirely in your browser.</p>,
    },
  ],
};
