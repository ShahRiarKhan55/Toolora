import { describe, expect, it } from 'vitest';
import { decodeBase64ToText, encodeTextToBase64 } from './logic';

describe('encodeTextToBase64', () => {
  it('encodes plain ASCII text', () => {
    expect(encodeTextToBase64('Hello')).toBe('SGVsbG8=');
  });

  it('encodes empty input to an empty string', () => {
    expect(encodeTextToBase64('')).toBe('');
  });

  it('encodes Unicode text correctly (not naive btoa)', () => {
    const encoded = encodeTextToBase64('日本語');
    expect(encoded).not.toBe('');
    const result = decodeBase64ToText(encoded);
    expect(result).toEqual({ ok: true, value: '日本語' });
  });

  it('encodes emoji correctly', () => {
    const encoded = encodeTextToBase64('🎉');
    const result = decodeBase64ToText(encoded);
    expect(result).toEqual({ ok: true, value: '🎉' });
  });
});

describe('decodeBase64ToText', () => {
  it('decodes plain ASCII Base64', () => {
    expect(decodeBase64ToText('SGVsbG8=')).toEqual({ ok: true, value: 'Hello' });
  });

  it('decodes empty input to an empty string', () => {
    expect(decodeBase64ToText('')).toEqual({ ok: true, value: '' });
  });

  it('round-trips arbitrary Unicode text through encode then decode', () => {
    const original = 'Café — こんにちは 🎉';
    expect(decodeBase64ToText(encodeTextToBase64(original))).toEqual({
      ok: true,
      value: original,
    });
  });

  it('rejects Base64 containing invalid characters', () => {
    expect(decodeBase64ToText('not base64!! (invalid)')).toEqual({
      ok: false,
      error: 'invalid-base64',
    });
  });

  it('rejects Base64 with an invalid length', () => {
    expect(decodeBase64ToText('A')).toEqual({ ok: false, error: 'invalid-base64' });
  });

  it('rejects valid Base64 that does not decode to valid UTF-8', () => {
    // A single 0x80 byte is a UTF-8 continuation byte with no lead byte: not valid UTF-8 on its own.
    const invalidUtf8 = btoa(String.fromCharCode(0x80));
    expect(decodeBase64ToText(invalidUtf8)).toEqual({ ok: false, error: 'invalid-utf8' });
  });
});
