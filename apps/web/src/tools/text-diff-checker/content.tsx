import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Paste the original text on the left and the changed text on the right.</li>
      <li>Select Compare.</li>
      <li>
        Read the result: added lines are marked + on green, removed lines − on red, and unchanged
        lines have no mark. Swap texts reverses the comparison.
      </li>
    </ol>
  ),
  about: (
    <>
      <p>
        This compares two texts line by line and shows what was added, removed or left alone, with
        the line numbers of both versions. It works for prose, lists, configuration files and code.
        A changed line appears as the old line removed followed by the new line added.
      </p>
      <p>
        The comparison finds the longest run of lines the two texts share (the same idea as{' '}
        <code>diff</code>), so moved-around text is shown as a removal and an addition rather than a
        move. Comparison is exact: a different capital letter or a trailing space makes a line
        different. Line-break styles (Windows, Mac, Unix) are treated as equal.
      </p>
      <p>
        Very large texts that differ almost everywhere cannot be compared in one go; compare them in
        smaller sections.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Is my text uploaded?',
      answer: (
        <p>No. Both texts are compared in your browser, and nothing is stored or sent anywhere.</p>
      ),
    },
    {
      question: 'Why is a changed line shown twice?',
      answer: (
        <p>
          A line diff only knows whole lines. An edited line is one line removed and one added, so
          you see the old version in red directly above the new one in green.
        </p>
      ),
    },
  ],
};
