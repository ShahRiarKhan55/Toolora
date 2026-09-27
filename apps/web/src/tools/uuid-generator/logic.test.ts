import { describe, expect, it } from 'vitest';
import { generateUuids, generateUuidV4, MAX_UUID_COUNT, parseCount } from './logic';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateUuidV4', () => {
  it('generates a well-formed UUID v4 (version and variant nibbles set)', () => {
    expect(generateUuidV4()).toMatch(UUID_V4_PATTERN);
  });

  it('generates different values on each call', () => {
    const first = generateUuidV4();
    const second = generateUuidV4();
    expect(first).not.toBe(second);
  });

  it('generates unique values across many calls', () => {
    const values = new Set(Array.from({ length: 500 }, () => generateUuidV4()));
    expect(values.size).toBe(500);
  });
});

describe('generateUuids', () => {
  it('generates the requested number of UUIDs', () => {
    expect(generateUuids(5)).toHaveLength(5);
  });

  it('generates a single UUID for a count of one', () => {
    const result = generateUuids(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(UUID_V4_PATTERN);
  });

  it('generates an empty list for a count of zero', () => {
    expect(generateUuids(0)).toEqual([]);
  });

  it('generates every value as valid and unique', () => {
    const result = generateUuids(20);
    for (const value of result) expect(value).toMatch(UUID_V4_PATTERN);
    expect(new Set(result).size).toBe(20);
  });
});

describe('parseCount', () => {
  it('accepts a normal count', () => {
    expect(parseCount('5')).toEqual({ ok: true, value: 5 });
  });

  it('accepts the minimum count of 1', () => {
    expect(parseCount('1')).toEqual({ ok: true, value: 1 });
  });

  it('accepts the maximum allowed count', () => {
    expect(parseCount(String(MAX_UUID_COUNT))).toEqual({ ok: true, value: MAX_UUID_COUNT });
  });

  it('rejects a count above the maximum', () => {
    expect(parseCount(String(MAX_UUID_COUNT + 1))).toEqual({ ok: false, error: 'too-many' });
  });

  it('rejects zero', () => {
    expect(parseCount('0')).toEqual({ ok: false, error: 'invalid-count' });
  });

  it('rejects a negative count', () => {
    expect(parseCount('-5')).toEqual({ ok: false, error: 'invalid-count' });
  });

  it('rejects a decimal count', () => {
    expect(parseCount('2.5')).toEqual({ ok: false, error: 'invalid-count' });
  });

  it('rejects non-numeric input', () => {
    expect(parseCount('abc')).toEqual({ ok: false, error: 'invalid-count' });
  });

  it('rejects empty input', () => {
    expect(parseCount('')).toEqual({ ok: false, error: 'invalid-count' });
  });
});
