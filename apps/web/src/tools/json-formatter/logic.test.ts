import { describe, expect, it } from 'vitest';
import { formatJson, minifyJson, parseJson } from './logic';

describe('parseJson', () => {
  it('parses a normal object', () => {
    const result = parseJson('{"a":1,"b":[1,2,3]}');
    expect(result).toEqual({ ok: true, value: { a: 1, b: [1, 2, 3] } });
  });

  it('parses top-level scalars (valid per the JSON spec)', () => {
    expect(parseJson('42')).toEqual({ ok: true, value: 42 });
    expect(parseJson('"hello"')).toEqual({ ok: true, value: 'hello' });
    expect(parseJson('true')).toEqual({ ok: true, value: true });
    expect(parseJson('null')).toEqual({ ok: true, value: null });
  });

  it('rejects empty input distinctly from a parse error', () => {
    expect(parseJson('')).toEqual({
      ok: false,
      failure: { error: 'empty-input', message: 'Enter some JSON to format.' },
    });
  });

  it('rejects whitespace-only input as empty', () => {
    const result = parseJson('   \n  ');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.error).toBe('empty-input');
  });

  it('rejects a trailing comma', () => {
    const result = parseJson('{"a":1,}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.error).toBe('parse-error');
      expect(result.failure.message.length).toBeGreaterThan(0);
    }
  });

  it('rejects unquoted keys', () => {
    const result = parseJson('{a:1}');
    expect(result.ok).toBe(false);
  });

  it('rejects an unmatched brace', () => {
    const result = parseJson('{"a":1');
    expect(result.ok).toBe(false);
  });

  it('rejects single-quoted strings', () => {
    const result = parseJson("{'a':1}");
    expect(result.ok).toBe(false);
  });

  it('parses Unicode text correctly', () => {
    const result = parseJson('{"greeting":"こんにちは 🎉 café"}');
    expect(result).toEqual({ ok: true, value: { greeting: 'こんにちは 🎉 café' } });
  });
});

describe('formatJson', () => {
  it('pretty-prints with the default two-space indent', () => {
    const result = formatJson('{"a":1}');
    expect(result).toEqual({ ok: true, value: '{\n  "a": 1\n}' });
  });

  it('supports a custom indent width', () => {
    const result = formatJson('{"a":1}', 4);
    expect(result).toEqual({ ok: true, value: '{\n    "a": 1\n}' });
  });

  it('formats nested structures', () => {
    const result = formatJson('{"a":{"b":[1,2]}}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('{\n  "a": {\n    "b": [\n      1,\n      2\n    ]\n  }\n}');
    }
  });

  it('propagates a parse failure instead of formatting', () => {
    const result = formatJson('not json');
    expect(result.ok).toBe(false);
  });

  it('propagates the empty-input failure', () => {
    const result = formatJson('');
    expect(result).toEqual({
      ok: false,
      failure: { error: 'empty-input', message: 'Enter some JSON to format.' },
    });
  });
});

describe('minifyJson', () => {
  it('removes insignificant whitespace', () => {
    const result = minifyJson('{\n  "a": 1,\n  "b": [1, 2, 3]\n}');
    expect(result).toEqual({ ok: true, value: '{"a":1,"b":[1,2,3]}' });
  });

  it('propagates a parse failure instead of minifying', () => {
    expect(minifyJson('{bad}').ok).toBe(false);
  });

  it('round-trips Unicode content', () => {
    const result = minifyJson('{"emoji":"🎉"}');
    expect(result).toEqual({ ok: true, value: '{"emoji":"🎉"}' });
  });
});
