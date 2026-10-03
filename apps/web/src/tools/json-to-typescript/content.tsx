import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Paste a representative JSON sample.</li>
      <li>Set the name of the root type (the default is Root).</li>
      <li>Select "Generate TypeScript" and copy the interfaces into your project.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        The generator reads your JSON and writes TypeScript interfaces describing its shape. Nested
        objects become their own interfaces named after their key, arrays become typed arrays, and
        null stays null. When the items of an array differ, the properties are merged: a key that is
        missing from some items becomes optional, and a property with different types becomes a
        union.
      </p>
      <p>
        The output describes the sample you pasted, not every JSON your API could return. A field
        that happens to be null in your sample is typed as null, and an empty array is unknown[];
        review the result and tighten it by hand. JSON does not distinguish integers from decimals,
        so all numbers are number. Your JSON is only parsed as data and never executed.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Why is a property typed as null?',
      answer: (
        <p>
          The sample contained null there, and a single sample cannot show what else the field may
          hold. Paste a sample with a real value, or edit the type to string | null.
        </p>
      ),
    },
    {
      question: 'What happens with keys like "first-name"?',
      answer: (
        <p>
          Keys that are not valid identifiers are quoted in the interface, and nested interface
          names are converted to PascalCase.
        </p>
      ),
    },
    {
      question: 'Is my JSON sent anywhere?',
      answer: <p>No. Generation runs entirely in your browser.</p>,
    },
  ],
};
