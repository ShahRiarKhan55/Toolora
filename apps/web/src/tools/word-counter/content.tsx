import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Paste or type your text into the box.</li>
      <li>Counts update as you type — no button to press.</li>
      <li>Select "Clear" to start over.</li>
    </ol>
  ),
  about: (
    <p>
      Word Counter reports words, characters (with and without spaces), sentences, paragraphs and an
      estimated reading time, based on an average reading speed of 200 words per minute. Everything
      is calculated as you type, entirely in your browser.
    </p>
  ),
  faq: [
    {
      question: 'How are sentences counted?',
      answer: (
        <p>
          By counting runs of text ending in a period, exclamation mark or question mark. This is an
          approximation — it will not perfectly handle every abbreviation or edge case.
        </p>
      ),
    },
    {
      question: 'How are paragraphs counted?',
      answer: <p>By one or more blank lines between blocks of text.</p>,
    },
    {
      question: 'How is reading time estimated?',
      answer: <p>Word count divided by 200 words per minute, rounded up to the nearest minute.</p>,
    },
  ],
};
