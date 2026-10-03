import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Choose a direction: CSV → JSON or JSON → CSV.</li>
      <li>
        Paste your data. For CSV, leave "First row is a header" ticked if the first row has column
        names.
      </li>
      <li>Select "Convert", then copy the result, or fix the reported problem and try again.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        CSV → JSON reads standard CSV: fields can be wrapped in double quotes, which lets them
        contain commas and line breaks, and a doubled quote ("") stands for one quote character.
        With a header row you get an array of objects; without one you get an array of arrays. Every
        value stays text, because CSV does not say whether 007 is a number or a code, so no types
        are guessed.
      </p>
      <p>
        JSON → CSV expects an array of objects (the header is every key found, in first-seen order)
        or an array of arrays. Objects or arrays nested inside a value are written as JSON text in
        that cell. Only comma-separated data is supported, not semicolons or tabs. If you open the
        CSV in a spreadsheet, be careful with cells that start with =, +, - or @: spreadsheets may
        treat them as formulas.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why are my numbers strings in the JSON?',
      answer: (
        <p>
          CSV has no types, so every value is kept exactly as written. Convert to numbers or
          booleans in your own code where you know the column's meaning.
        </p>
      ),
    },
    {
      question: 'Why does it say a row has the wrong number of fields?',
      answer: (
        <p>
          With a header, every row must have the same number of fields as the header. A common cause
          is an unquoted comma inside a value: wrap that value in double quotes.
        </p>
      ),
    },
    {
      question: 'Is my data uploaded?',
      answer: (
        <p>No. Parsing and conversion happen in your browser, and the data is never executed.</p>
      ),
    },
  ],
};
