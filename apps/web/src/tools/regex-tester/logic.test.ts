import { describe, expect, it } from 'vitest';
import { MAX_MATCHES, testRegex } from './logic';

function matchesOf(pattern: string, flags: string, text: string) {
  const outcome = testRegex(pattern, flags, text);
  if (!outcome.ok) throw new Error(outcome.message);
  return outcome.value;
}

describe('testRegex', () => {
  it('finds a single match with its position', () => {
    const { matches } = matchesOf('b+', '', 'aabbbcc');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ text: 'bbb', index: 2, end: 5 });
  });

  it('reports only the first match without the g flag', () => {
    expect(matchesOf('\\d', '', 'a1b2c3').matches.map((m) => m.text)).toEqual(['1']);
  });

  it('reports every match with the g flag', () => {
    const { matches } = matchesOf('\\d', 'g', 'a1b2c3');
    expect(matches.map((m) => m.text)).toEqual(['1', '2', '3']);
    expect(matches.map((m) => m.index)).toEqual([1, 3, 5]);
  });

  it('returns no matches (not an error) when nothing matches', () => {
    expect(matchesOf('xyz', 'g', 'abc')).toEqual({ matches: [], truncated: false });
  });

  it('returns no matches for empty text', () => {
    expect(matchesOf('a', 'g', '').matches).toEqual([]);
  });

  it('honours the i flag', () => {
    expect(matchesOf('abc', '', 'ABC').matches).toHaveLength(0);
    expect(matchesOf('abc', 'i', 'ABC').matches).toHaveLength(1);
  });

  it('honours the m flag for ^ and $', () => {
    expect(matchesOf('^\\w', 'g', 'ab\ncd').matches).toHaveLength(1);
    expect(matchesOf('^\\w', 'gm', 'ab\ncd').matches.map((m) => m.text)).toEqual(['a', 'c']);
  });

  it('honours the s flag for .', () => {
    expect(matchesOf('a.b', '', 'a\nb').matches).toHaveLength(0);
    expect(matchesOf('a.b', 's', 'a\nb').matches).toHaveLength(1);
  });

  it('captures numbered and named groups', () => {
    const [match] = matchesOf('(?<year>\\d{4})-(\\d{2})', '', 'on 2026-10-03').matches;
    expect(match?.groups).toEqual(['2026', '10']);
    expect(match?.namedGroups).toEqual({ year: '2026' });
  });

  it('reports a group that did not participate as undefined', () => {
    const [match] = matchesOf('(a)|(b)', '', 'b').matches;
    expect(match?.groups).toEqual([undefined, 'b']);
  });

  it('treats special characters literally when escaped', () => {
    expect(matchesOf('\\.\\*\\(', 'g', 'a.*(b').matches.map((m) => m.text)).toEqual(['.*(']);
    expect(matchesOf('[$^]', 'g', 'a$b^').matches).toHaveLength(2);
  });

  it('matches Unicode text and counts positions in UTF-16 units', () => {
    const { matches } = matchesOf('東京', 'g', '東京と東京');
    expect(matches.map((m) => m.index)).toEqual([0, 3]);
  });

  it('terminates on zero-length matches', () => {
    const { matches } = matchesOf('x*', 'g', 'ab');
    expect(matches.map((m) => m.index)).toEqual([0, 1, 2]);
  });

  it('stops at the match limit and says so', () => {
    const result = matchesOf('a', 'g', 'a'.repeat(MAX_MATCHES + 50));
    expect(result.matches).toHaveLength(MAX_MATCHES);
    expect(result.truncated).toBe(true);
  });

  it('rejects an empty pattern', () => {
    expect(testRegex('', 'g', 'abc')).toMatchObject({ ok: false, error: 'empty-pattern' });
  });

  it('rejects an invalid pattern with the engine message', () => {
    const outcome = testRegex('(unclosed', 'g', 'abc');
    expect(outcome).toMatchObject({ ok: false, error: 'invalid-pattern' });
    if (!outcome.ok) expect(outcome.message).not.toBe('');
  });

  it('rejects invalid and duplicate flags', () => {
    expect(testRegex('a', 'x', 'a')).toMatchObject({ ok: false, error: 'invalid-flags' });
    expect(testRegex('a', 'gg', 'a')).toMatchObject({ ok: false, error: 'invalid-flags' });
  });

  it('never evaluates the pattern or text as code', () => {
    const globals = globalThis as { __pwned?: boolean };
    testRegex('(?:)', '', 'globalThis.__pwned = true');
    testRegex('globalThis.__pwned = true', 'g', 'globalThis.__pwned = true');
    expect(globals.__pwned).toBeUndefined();
  });
});
