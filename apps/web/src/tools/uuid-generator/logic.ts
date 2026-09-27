export const MAX_UUID_COUNT = 100;

/**
 * Generates one cryptographically random UUID v4. Uses `crypto.randomUUID()` where available and
 * falls back to building one from `crypto.getRandomValues` — never `Math.random`, which is not
 * cryptographically secure and would make UUIDs guessable.
 */
export function generateUuidV4(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

export function generateUuids(count: number): string[] {
  return Array.from({ length: count }, () => generateUuidV4());
}

export type CountError = 'invalid-count' | 'too-many';

export type CountOutcome = { ok: true; value: number } | { ok: false; error: CountError };

/** Parses and bounds a requested UUID count from user text (1 to `MAX_UUID_COUNT`). */
export function parseCount(input: string): CountOutcome {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: 'invalid-count' };

  const value = Number(trimmed);
  if (value < 1) return { ok: false, error: 'invalid-count' };
  if (value > MAX_UUID_COUNT) return { ok: false, error: 'too-many' };
  return { ok: true, value };
}

export const COUNT_ERROR_MESSAGES: Record<CountError, string> = {
  'invalid-count': 'Enter a whole number of 1 or more.',
  'too-many': `Generate at most ${MAX_UUID_COUNT} at a time.`,
};
