import { describe, expect, it } from 'vitest';
import { decodeUrlComponent, encodeUrlComponent } from './logic';

describe('encodeUrlComponent', () => {
  it('encodes spaces and punctuation', () => {
    expect(encodeUrlComponent('a b&c=d/e?f#g')).toBe('a%20b%26c%3Dd%2Fe%3Ff%23g');
  });

  it('leaves unreserved characters alone', () => {
    expect(encodeUrlComponent("AZaz09-_.!~*'()")).toBe("AZaz09-_.!~*'()");
  });

  it('encodes Unicode as UTF-8', () => {
    expect(encodeUrlComponent('日本語')).toBe('%E6%97%A5%E6%9C%AC%E8%AA%9E');
    expect(encodeUrlComponent('😀')).toBe('%F0%9F%98%80');
  });

  it('returns an empty string for empty input', () => {
    expect(encodeUrlComponent('')).toBe('');
  });

  it('does not throw on a lone surrogate', () => {
    expect(encodeUrlComponent('\ud800')).toBe('%EF%BF%BD');
  });
});

describe('decodeUrlComponent', () => {
  it('decodes percent-encoded text, including Unicode', () => {
    expect(decodeUrlComponent('%E6%97%A5%E6%9C%AC%E8%AA%9E')).toEqual({
      ok: true,
      value: '日本語',
    });
    expect(decodeUrlComponent('a%20b%26c')).toEqual({ ok: true, value: 'a b&c' });
  });

  it('does not turn + into a space', () => {
    expect(decodeUrlComponent('a+b')).toEqual({ ok: true, value: 'a+b' });
  });

  it('round-trips', () => {
    const text = 'name=José & co/日本 😀?';
    expect(decodeUrlComponent(encodeUrlComponent(text))).toEqual({ ok: true, value: text });
  });

  it('accepts empty input', () => {
    expect(decodeUrlComponent('')).toEqual({ ok: true, value: '' });
  });

  it.each(['%', '%E', '%ZZ', '100%', '%E6%97', '%C0%80', '%FF'])(
    'reports malformed input %s instead of throwing',
    (input) => {
      expect(decodeUrlComponent(input)).toEqual({ ok: false, error: 'malformed' });
    },
  );
});
