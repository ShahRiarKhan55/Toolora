import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities, encodeHtmlEntities } from './logic';

describe('encodeHtmlEntities', () => {
  it('leaves ordinary ASCII alone', () => {
    expect(encodeHtmlEntities('Hello, world 123')).toBe('Hello, world 123');
  });

  it('escapes the HTML-sensitive characters', () => {
    expect(encodeHtmlEntities(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;',
    );
  });

  it('does not double-escape on a single pass but does on a repeated one', () => {
    const once = encodeHtmlEntities('<');
    expect(once).toBe('&lt;');
    expect(encodeHtmlEntities(once)).toBe('&amp;lt;');
  });

  it('keeps Unicode by default and can write it as numeric entities', () => {
    expect(encodeHtmlEntities('日本 é')).toBe('日本 é');
    expect(encodeHtmlEntities('日é', true)).toBe('&#26085;&#233;');
    expect(encodeHtmlEntities('😀', true)).toBe('&#128512;');
  });

  it('handles empty input', () => {
    expect(encodeHtmlEntities('')).toBe('');
  });
});

describe('decodeHtmlEntities', () => {
  it('decodes the basic named entities', () => {
    expect(decodeHtmlEntities('&lt;p&gt; &amp; &quot;q&quot; &#39;s&#39; &apos;')).toEqual({
      ok: true,
      value: `<p> & "q" 's' '`,
    });
  });

  it('decodes other named and numeric entities', () => {
    expect(decodeHtmlEntities('&copy; &eacute; &#26085; &#x65E5; &#128512; &nbsp;')).toEqual({
      ok: true,
      value: '© é 日 日 😀  ',
    });
  });

  it('round-trips encode → decode, including repeated rounds', () => {
    const text = `a < b && "c" > 'd' 日本 😀`;
    let encoded = text;
    for (let i = 0; i < 3; i++) encoded = encodeHtmlEntities(encoded);
    let decoded = encoded;
    for (let i = 0; i < 3; i++) {
      const result = decodeHtmlEntities(decoded);
      expect(result.ok).toBe(true);
      decoded = result.ok ? result.value : '';
    }
    expect(decoded).toBe(text);
  });

  it('decodes one level at a time', () => {
    expect(decodeHtmlEntities('&amp;lt;')).toEqual({ ok: true, value: '&lt;' });
  });

  it('keeps tags as text instead of treating them as HTML', () => {
    const result = decodeHtmlEntities(
      '&lt;script&gt;alert(1)&lt;/script&gt;<img src=x onerror=alert(1)>',
    );
    expect(result).toEqual({
      ok: true,
      value: '<script>alert(1)</script><img src=x onerror=alert(1)>',
    });
  });

  it('keeps a bare ampersand that is not an entity', () => {
    expect(decodeHtmlEntities('AT&T and a & b')).toEqual({ ok: true, value: 'AT&T and a & b' });
  });

  it.each(['&notarealentity;', '&#1114112;', '&#0;', '&#xD800;', '&#xFFFFFF;'])(
    'reports the malformed entity %s',
    (entity) => {
      expect(decodeHtmlEntities(`ok ${entity} ok`)).toEqual({
        ok: false,
        error: 'unknown-entity',
        entities: [entity],
      });
    },
  );

  it('handles empty input', () => {
    expect(decodeHtmlEntities('')).toEqual({ ok: true, value: '' });
  });
});
