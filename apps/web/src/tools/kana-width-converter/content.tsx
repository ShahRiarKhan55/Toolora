import type { ToolContent } from '../types';

export const content: ToolContent = {
  howToUse: (
    <ol>
      <li>Choose a conversion: hiragana ↔ katakana, or full-width ↔ half-width.</li>
      <li>For a width conversion, optionally limit it to Latin characters or to katakana.</li>
      <li>Type or paste text. The result updates as you type; copy it when ready.</li>
    </ol>
  ),
  about: (
    <>
      <p>
        Japanese text mixes several scripts, and forms and systems are often picky about which one
        they accept. Furigana fields want hiragana or katakana, older systems want half-width
        katakana, and many databases want half-width digits and letters.
      </p>
      <p>
        Hiragana and katakana map one-to-one by a fixed offset in Unicode, so the conversion is
        exact; the prolonged sound mark ー, punctuation, kanji and anything else stays as it is.
        Half-width katakana writes a voiced kana as two characters (ｶ + ﾞ); full-width conversion
        joins them back (ガ), and half-width conversion splits them. Full-width Latin letters,
        digits and symbols map to their ASCII forms, and the ideographic space becomes a normal
        space (and back).
      </p>
      <p>
        A few katakana (ヮ ヰ ヱ ヵ ヶ) have no half-width form and are left unchanged. Half-width
        katakana is legacy: prefer full-width in new text unless a system requires otherwise.
      </p>
    </>
  ),
  faq: [
    {
      question: 'Does it convert kanji to kana?',
      answer: (
        <p>
          No. Turning kanji into readings needs a dictionary. This tool only converts between
          scripts and widths.
        </p>
      ),
    },
    {
      question: 'Is my text sent anywhere?',
      answer: <p>No. Conversion happens in your browser using plain JavaScript.</p>,
    },
  ],
};
