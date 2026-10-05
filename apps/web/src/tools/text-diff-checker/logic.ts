export type DiffLineType = 'same' | 'added' | 'removed';

export interface DiffLine {
  type: DiffLineType;
  text: string;
  /** 1-based line number in the original text (absent for added lines). */
  oldLine?: number;
  /** 1-based line number in the changed text (absent for removed lines). */
  newLine?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  added: number;
  removed: number;
  unchanged: number;
}

/** Cap on the comparison table (lines × lines after trimming the common start and end). */
export const MAX_DIFF_CELLS = 4_000_000;

export type DiffOutcome = { ok: true; value: DiffResult } | { ok: false; error: 'too-large' };

export const DIFF_ERROR_MESSAGES = {
  'too-large':
    'These texts differ over too many lines to compare at once. Compare smaller sections instead.',
} as const;

/** Lines of a text; CRLF, CR and LF all break lines, and one trailing line break does not add a line. */
export function splitLines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/**
 * Line-by-line diff (longest common subsequence). The common start and end are peeled off first, so
 * two similar long texts cost almost nothing; only the differing middle is compared in a table.
 * Within a changed block, removed lines come before added ones. Comparison is exact: case and
 * whitespace matter.
 */
export function diffLines(original: string, changed: string): DiffOutcome {
  const a = splitLines(original);
  const b = splitLines(changed);

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const n = endA - start;
  const m = endB - start;
  if ((n + 1) * (m + 1) > MAX_DIFF_CELLS) return { ok: false, error: 'too-large' };

  // lcs[i][j] = length of the longest common subsequence of the middle of a from i and b from j.
  const width = m + 1;
  const lcs = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * width + j] =
        a[start + i] === b[start + j]
          ? lcs[(i + 1) * width + j + 1]! + 1
          : Math.max(lcs[(i + 1) * width + j]!, lcs[i * width + j + 1]!);
    }
  }

  const lines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;
  const same = (text: string) =>
    lines.push({ type: 'same', text, oldLine: ++oldLine, newLine: ++newLine });
  const removed = (text: string) => lines.push({ type: 'removed', text, oldLine: ++oldLine });
  const added = (text: string) => lines.push({ type: 'added', text, newLine: ++newLine });

  for (let k = 0; k < start; k++) same(a[k]!);
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[start + i] === b[start + j]) {
      same(a[start + i]!);
      i++;
      j++;
    } else if (j >= m || (i < n && lcs[(i + 1) * width + j]! >= lcs[i * width + j + 1]!)) {
      removed(a[start + i]!);
      i++;
    } else {
      added(b[start + j]!);
      j++;
    }
  }
  for (let k = endA; k < a.length; k++) same(a[k]!);

  const count = (type: DiffLineType) => lines.filter((line) => line.type === type).length;
  return {
    ok: true,
    value: { lines, added: count('added'), removed: count('removed'), unchanged: count('same') },
  };
}
