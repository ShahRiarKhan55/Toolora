import { describe, expect, it } from 'vitest';
import { dateToTimestamp, timestampToDate } from './logic';

describe('timestampToDate', () => {
  it('converts the epoch (0 seconds)', () => {
    expect(timestampToDate('0', 'seconds')).toEqual({
      ok: true,
      value: { epochMs: 0, utcIso: '1970-01-01T00:00:00.000Z' },
    });
  });

  it('converts a normal seconds timestamp', () => {
    const seconds = 1700000000;
    const result = timestampToDate(String(seconds), 'seconds');
    expect(result).toEqual({
      ok: true,
      value: { epochMs: seconds * 1000, utcIso: new Date(seconds * 1000).toISOString() },
    });
  });

  it('converts a normal milliseconds timestamp', () => {
    const ms = 1700000000123;
    const result = timestampToDate(String(ms), 'milliseconds');
    expect(result).toEqual({
      ok: true,
      value: { epochMs: ms, utcIso: new Date(ms).toISOString() },
    });
  });

  it('converts a fractional seconds timestamp', () => {
    const result = timestampToDate('1700000000.5', 'seconds');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.epochMs).toBe(1700000000500);
  });

  it('converts a negative (pre-1970) timestamp', () => {
    const result = timestampToDate('-3600', 'seconds');
    expect(result).toEqual({
      ok: true,
      value: { epochMs: -3600000, utcIso: '1969-12-31T23:00:00.000Z' },
    });
  });

  it('rejects a blank timestamp', () => {
    expect(timestampToDate('', 'seconds')).toEqual({ ok: false, error: 'invalid-timestamp' });
  });

  it('rejects a non-numeric timestamp', () => {
    expect(timestampToDate('abc', 'seconds')).toEqual({ ok: false, error: 'invalid-timestamp' });
  });

  it('rejects a timestamp outside the representable date range', () => {
    expect(timestampToDate('1e300', 'seconds')).toEqual({ ok: false, error: 'out-of-range' });
  });
});

describe('dateToTimestamp', () => {
  it('converts a datetime-local value as UTC', () => {
    const result = dateToTimestamp('2024-01-01T00:00');
    expect(result).toEqual({
      ok: true,
      value: {
        seconds: Date.UTC(2024, 0, 1, 0, 0) / 1000,
        milliseconds: Date.UTC(2024, 0, 1, 0, 0),
      },
    });
  });

  it('accepts a value that already carries a timezone', () => {
    const result = dateToTimestamp('2024-01-01T00:00:00Z');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.milliseconds).toBe(Date.UTC(2024, 0, 1, 0, 0, 0));
  });

  it('rejects an empty value', () => {
    expect(dateToTimestamp('')).toEqual({ ok: false, error: 'invalid-date' });
  });

  it('rejects a malformed value', () => {
    expect(dateToTimestamp('not-a-date')).toEqual({ ok: false, error: 'invalid-date' });
  });
});
