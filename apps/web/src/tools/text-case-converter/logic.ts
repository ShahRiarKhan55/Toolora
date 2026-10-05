export const CASE_OPTIONS = [
  { id: 'lower', label: 'lowercase' },
  { id: 'upper', label: 'UPPERCASE' },
  { id: 'title', label: 'Title Case' },
  { id: 'sentence', label: 'Sentence case' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
] as const;

export type CaseId = (typeof CASE_OPTIONS)[number]['id'];

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

/**
 * Splits one line into words: runs of letters/digits, with a boundary inside `fooBar` and
 * `HTTPServer` (→ foo Bar, HTTP Server). Everything else (spaces, `_`, `-`, punctuation) is a separator.
 */
function splitWords(line: string): string[] {
  return (
    line
      .replace(/(?<=[\p{Ll}\p{N}])(?=\p{Lu})/gu, ' ')
      .replace(/(?<=\p{Lu})(?=\p{Lu}\p{Ll})/gu, ' ')
      .match(/[\p{L}\p{M}\p{N}]+/gu) ?? []
  );
}

const joinLines = (text: string, convert: (line: string) => string) =>
  text
    .split(/(\r?\n)/)
    .map((part, i) => (i % 2 === 1 ? part : convert(part)))
    .join('');

/**
 * Deterministic, locale-independent conversions. Line breaks are kept; programming cases convert
 * each line on its own. Title Case capitalises every word (no small-word rules) and sentence case
 * capitalises the first letter of the text and after `. ! ? 。！？` or a line break.
 */
export function convertCase(input: string, target: CaseId): string {
  switch (target) {
    case 'lower':
      return input.toLowerCase();
    case 'upper':
      return input.toUpperCase();
    case 'title':
      return input
        .toLowerCase()
        .replace(
          /(^|[^\p{L}\p{N}'’])(\p{L})/gu,
          (_, before: string, letter: string) => before + letter.toUpperCase(),
        );
    case 'sentence':
      return input
        .toLowerCase()
        .replace(
          /(^\s*|[.!?。！？]\s+|\n\s*)(\p{L})/gu,
          (_, before: string, letter: string) => before + letter.toUpperCase(),
        );
    case 'camel':
      return joinLines(input, (line) =>
        splitWords(line)
          .map((word, i) => (i === 0 ? word.toLowerCase() : capitalize(word)))
          .join(''),
      );
    case 'pascal':
      return joinLines(input, (line) => splitWords(line).map(capitalize).join(''));
    case 'snake':
      return joinLines(input, (line) => splitWords(line).join('_').toLowerCase());
    case 'kebab':
      return joinLines(input, (line) => splitWords(line).join('-').toLowerCase());
  }
}
