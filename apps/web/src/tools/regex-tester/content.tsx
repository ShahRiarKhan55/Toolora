import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>
        Type your pattern without the surrounding slashes, for example \d{'{3}'}-\d{'{4}'}.
      </li>
      <li>Tick the flags you need. "g" is on by default so every match is listed.</li>
      <li>Paste the text to search. Matches update as you type.</li>
      <li>Read each match, its position and its capture groups, or copy the matched text.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        The tester compiles your pattern with your browser's built-in JavaScript regular expression
        engine, so results match what the same pattern does in JavaScript and TypeScript code. Your
        pattern and text are only ever used as data: nothing is evaluated as code, and nothing
        leaves your browser.
      </p>
      <p>
        Positions are counted in UTF-16 code units, the way JavaScript counts string indexes, so
        characters outside the basic plane (many emoji) count as two. Other languages' regex engines
        differ in syntax and behavior, so a pattern that works here may need changes elsewhere. A
        pattern with heavy backtracking can make any browser tab slow; if the page stalls, simplify
        the pattern.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why do I only see one match?',
      answer: (
        <p>
          Without the "g" (global) flag a regular expression stops at the first match. Tick "g" to
          list all of them.
        </p>
      ),
    },
    {
      question: 'What does an invalid pattern look like?',
      answer: (
        <p>
          Unbalanced brackets, a dangling quantifier or an unknown escape are reported with the
          browser's own error message under the pattern box, and no matches are shown.
        </p>
      ),
    },
    {
      question: 'Why is there an "(empty match)"?',
      answer: (
        <p>
          Patterns such as x* can match zero characters. Those matches are real, so they are listed
          with their position.
        </p>
      ),
    },
    {
      question: 'Is my text sent anywhere?',
      answer: <p>No. Matching runs entirely in your browser.</p>,
    },
  ],
};
