const WORDS_PER_MINUTE = 200;

export interface TextStats {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
}

/** Counts words, characters, sentences and paragraphs, and estimates reading time. Pure and total —
 *  every input, including empty and whitespace-only text, produces a valid (all-zero) result. */
export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();

  const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  const characterCount = text.length;
  const characterCountNoSpaces = text.replace(/\s/g, '').length;

  const sentenceCount =
    trimmed === ''
      ? 0
      : trimmed.split(/[.!?]+/).filter((sentence) => sentence.trim() !== '').length;

  const paragraphCount =
    trimmed === '' ? 0 : trimmed.split(/\n\s*\n+/).filter((p) => p.trim() !== '').length;

  const readingTimeMinutes = wordCount === 0 ? 0 : Math.ceil(wordCount / WORDS_PER_MINUTE);

  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    sentenceCount,
    paragraphCount,
    readingTimeMinutes,
  };
}
