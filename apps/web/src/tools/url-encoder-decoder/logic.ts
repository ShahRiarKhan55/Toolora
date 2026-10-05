export type UrlDecodeResult = { ok: true; value: string } | { ok: false; error: 'malformed' };

export const URL_DECODE_ERROR_MESSAGES = {
  malformed:
    'This is not valid percent-encoding. Check for a "%" that is not followed by two hex digits, or bytes that are not valid UTF-8.',
} as const;

// A high surrogate not followed by a low one, or a low one not preceded by a high one.
const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;

/** Component encoding (`encodeURIComponent`): also escapes `/ ? & = # :`, so it suits one value, not a whole URL. */
export function encodeUrlComponent(input: string): string {
  // encodeURIComponent throws on a lone surrogate; replace it with U+FFFD like TextEncoder does.
  return encodeURIComponent(input.replace(LONE_SURROGATE, '�'));
}

export function decodeUrlComponent(input: string): UrlDecodeResult {
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: 'malformed' };
  }
}
