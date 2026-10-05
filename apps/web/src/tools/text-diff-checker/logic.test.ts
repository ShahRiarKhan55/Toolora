import { describe, expect, it } from 'vitest';
import { diffLines, splitLines, MAX_DIFF_CELLS } from './logic';
import type { DiffLine } from './logic';

function diff(a: string, b: string) {
  const outcome = diffLines(a, b);
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
}
const compact = (lines: DiffLine[]) =>
  lines.map((l) => `${l.type === 'same' ? ' ' : l.type === 'added' ? '+' : '-'}${l.text}`);

describe('splitLines', () => {
  it('splits on every line-break style and ignores one trailing break', () => {
    expect(splitLines('a\nb')).toEqual(['a', 'b']);
    expect(splitLines('a\r\nb\rc\n')).toEqual(['a', 'b', 'c']);
    expect(splitLines('a\n\n')).toEqual(['a', '']);
  });

  it('returns no lines for empty text but one for a lone line break', () => {
    expect(splitLines('')).toEqual([]);
    expect(splitLines('\n')).toEqual(['']);
  });
});

describe('diffLines', () => {
  it('reports identical text as all unchanged', () => {
    const result = diff('one\ntwo\nthree', 'one\ntwo\nthree');
    expect(result).toMatchObject({ added: 0, removed: 0, unchanged: 3 });
    expect(compact(result.lines)).toEqual([' one', ' two', ' three']);
  });

  it('finds an added line', () => {
    const result = diff('a\nc', 'a\nb\nc');
    expect(compact(result.lines)).toEqual([' a', '+b', ' c']);
    expect(result).toMatchObject({ added: 1, removed: 0, unchanged: 2 });
  });

  it('finds a removed line', () => {
    const result = diff('a\nb\nc', 'a\nc');
    expect(compact(result.lines)).toEqual([' a', '-b', ' c']);
    expect(result).toMatchObject({ added: 0, removed: 1, unchanged: 2 });
  });

  it('shows a changed line as a removal followed by an addition', () => {
    const result = diff('a\nold\nc', 'a\nnew\nc');
    expect(compact(result.lines)).toEqual([' a', '-old', '+new', ' c']);
    expect(result).toMatchObject({ added: 1, removed: 1, unchanged: 2 });
  });

  it('numbers lines in each text', () => {
    const { lines } = diff('a\nold\nc', 'a\nnew\nc');
    expect(lines.map((l) => [l.oldLine, l.newLine])).toEqual([
      [1, 1],
      [2, undefined],
      [undefined, 2],
      [3, 3],
    ]);
  });

  it('handles empty input on either or both sides', () => {
    expect(diff('', '')).toMatchObject({ lines: [], added: 0, removed: 0, unchanged: 0 });
    expect(compact(diff('', 'a\nb').lines)).toEqual(['+a', '+b']);
    expect(compact(diff('a\nb', '').lines)).toEqual(['-a', '-b']);
  });

  it('handles multiline blocks, keeping the shared lines', () => {
    const result = diff('1\n2\n3\n4\n5', '1\n3\n4\nx\ny\n5');
    expect(compact(result.lines)).toEqual([' 1', '-2', ' 3', ' 4', '+x', '+y', ' 5']);
  });

  it('treats different line-break styles as the same lines', () => {
    expect(diff('a\r\nb', 'a\nb')).toMatchObject({ added: 0, removed: 0, unchanged: 2 });
  });

  it('is exact about case and whitespace', () => {
    expect(diff('Hello', 'hello')).toMatchObject({ added: 1, removed: 1 });
    expect(diff('a ', 'a')).toMatchObject({ added: 1, removed: 1 });
  });

  it('compares Japanese and other Unicode text', () => {
    const result = diff('こんにちは\n世界\n😀', 'こんにちは\n世界！\n😀');
    expect(compact(result.lines)).toEqual([' こんにちは', '-世界', '+世界！', ' 😀']);
  });

  it('keeps repeated lines straight', () => {
    const result = diff('a\na\nb', 'a\nb\nb');
    expect(compact(result.lines)).toEqual([' a', '-a', '+b', ' b']);
    expect(result).toMatchObject({ added: 1, removed: 1, unchanged: 2 });
  });

  it('counts always add up to the sizes of both texts', () => {
    const a = 'p\nq\nr\ns\nt\nu';
    const b = 'q\nr\nX\ns\nu\nv';
    const r = diff(a, b);
    expect(r.unchanged + r.removed).toBe(6);
    expect(r.unchanged + r.added).toBe(6);
  });

  it('handles large-but-reasonable input quickly', () => {
    const a = Array.from({ length: 3000 }, (_, i) => `line ${i}`);
    const b = [...a];
    b[1000] = 'changed';
    b.splice(2000, 0, 'inserted');
    b.splice(2500, 1);
    const started = Date.now();
    const r = diff(a.join('\n'), b.join('\n'));
    expect(r).toMatchObject({ added: 2, removed: 2, unchanged: 2998 });
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('compares a fully different 1500-line pair within the table limit', () => {
    const a = Array.from({ length: 1500 }, (_, i) => `a${i}`).join('\n');
    const b = Array.from({ length: 1500 }, (_, i) => `b${i}`).join('\n');
    expect(diff(a, b)).toMatchObject({ added: 1500, removed: 1500, unchanged: 0 });
  });

  it('refuses a comparison beyond the table limit instead of freezing', () => {
    const side = Math.ceil(Math.sqrt(MAX_DIFF_CELLS)) + 1;
    const a = Array.from({ length: side }, (_, i) => `a${i}`).join('\n');
    const b = Array.from({ length: side }, (_, i) => `b${i}`).join('\n');
    expect(diffLines(a, b)).toEqual({ ok: false, error: 'too-large' });
  });
});
