// Naive `btoa(text)` / `atob(base64)` corrupt any character outside Latin1 (e.g. "日本語", emoji).
// Encoding goes through TextEncoder to get UTF-8 bytes first; decoding goes through TextDecoder to
// turn the resulting bytes back into a Unicode string, so round-trips are correct either way.

/** Encodes text (any Unicode) to Base64. Never throws — every string has a valid encoding. */
export function encodeTextToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export type Base64DecodeError = 'invalid-base64' | 'invalid-utf8';

export type Base64DecodeOutcome =
  { ok: true; value: string } | { ok: false; error: Base64DecodeError };

/** Decodes Base64 back to text, rejecting both malformed Base64 and bytes that are not valid UTF-8. */
export function decodeBase64ToText(input: string): Base64DecodeOutcome {
  let binary: string;
  try {
    binary = atob(input);
  } catch {
    return { ok: false, error: 'invalid-base64' };
  }

  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return { ok: true, value: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: 'invalid-utf8' };
  }
}

export const BASE64_DECODE_ERROR_MESSAGES: Record<Base64DecodeError, string> = {
  'invalid-base64': 'That is not valid Base64.',
  'invalid-utf8': 'That Base64 is valid, but it does not decode to valid UTF-8 text.',
};
