import { describe, expect, it } from 'vitest';
import { analyzeText } from './logic';

describe('analyzeText', () => {
  it('returns all zeros for empty input', () => {
    expect(analyzeText('')).toEqual({
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
    });
  });

  it('does not count whitespace-only input as a word', () => {
    const result = analyzeText('   \n\t  ');
    expect(result.wordCount).toBe(0);
    expect(result.sentenceCount).toBe(0);
    expect(result.paragraphCount).toBe(0);
  });

  it('counts a single word', () => {
    const result = analyzeText('Hello');
    expect(result.wordCount).toBe(1);
    expect(result.sentenceCount).toBe(1);
  });

  it('does not inflate word count for multiple spaces between words', () => {
    expect(analyzeText('one   two    three').wordCount).toBe(3);
  });

  it('counts words across newlines', () => {
    expect(analyzeText('one\ntwo\nthree').wordCount).toBe(3);
  });

  it('counts characters including and excluding spaces', () => {
    const result = analyzeText('a b');
    expect(result.characterCount).toBe(3);
    expect(result.characterCountNoSpaces).toBe(2);
  });

  it('counts sentences by terminal punctuation', () => {
    expect(analyzeText('One. Two! Three?').sentenceCount).toBe(3);
  });

  it('treats text with no terminal punctuation as one sentence', () => {
    expect(analyzeText('No punctuation here').sentenceCount).toBe(1);
  });

  it('does not count trailing punctuation as an extra empty sentence', () => {
    expect(analyzeText('One sentence.').sentenceCount).toBe(1);
  });

  it('counts paragraphs separated by a blank line', () => {
    expect(analyzeText('Paragraph one.\n\nParagraph two.').paragraphCount).toBe(2);
  });

  it('treats text with no blank line as one paragraph', () => {
    expect(analyzeText('Line one.\nLine two.').paragraphCount).toBe(1);
  });

  it('collapses multiple blank lines into one paragraph break', () => {
    expect(analyzeText('One.\n\n\n\nTwo.').paragraphCount).toBe(2);
  });

  it('estimates reading time from word count at 200 words per minute', () => {
    const words = Array.from({ length: 400 }, () => 'word').join(' ');
    expect(analyzeText(words).readingTimeMinutes).toBe(2);
  });

  it('rounds reading time up to at least one minute for any non-empty text', () => {
    expect(analyzeText('just a few words').readingTimeMinutes).toBe(1);
  });
});
