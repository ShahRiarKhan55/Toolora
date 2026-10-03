import { describe, expect, it } from 'vitest';
import { formatPhoneNumber } from './logic';

function ok(input: string) {
  const outcome = formatPhoneNumber(input);
  if (!outcome.ok) throw new Error(outcome.error);
  return outcome.value;
}

describe('formatPhoneNumber', () => {
  it('formats mobile numbers as 3-4-4', () => {
    expect(ok('09012345678')).toMatchObject({
      digits: '09012345678',
      domestic: '090-1234-5678',
      international: '+81-90-1234-5678',
      kind: 'mobile',
    });
    expect(ok('08012345678').domestic).toBe('080-1234-5678');
    expect(ok('07012345678').domestic).toBe('070-1234-5678');
  });

  it('formats Tokyo and Osaka landlines as 2-4-4', () => {
    expect(ok('0312345678')).toMatchObject({
      domestic: '03-1234-5678',
      international: '+81-3-1234-5678',
      kind: 'landline',
    });
    expect(ok('0612345678').domestic).toBe('06-1234-5678');
  });

  it('formats a short list of three-digit metro area codes as 3-3-4', () => {
    expect(ok('0451234567').domestic).toBe('045-123-4567');
    expect(ok('0521234567').domestic).toBe('052-123-4567');
  });

  it('does not guess for prefixes shared with four-digit area codes', () => {
    expect(ok('0422123456').domestic).toBeNull(); // 0422… is a 4-digit area code, not 042
  });

  it('formats toll-free, navi-dial and IP-phone numbers', () => {
    expect(ok('0120123456')).toMatchObject({ domestic: '0120-123-456', kind: 'toll-free' });
    expect(ok('08001234567')).toMatchObject({ domestic: '0800-123-4567', kind: 'toll-free' });
    expect(ok('0570123456')).toMatchObject({ domestic: '0570-123-456', kind: 'navi-dial' });
    expect(ok('05012345678')).toMatchObject({ domestic: '050-1234-5678', kind: 'ip-phone' });
  });

  it('removes hyphens, spaces, dots and parentheses', () => {
    expect(ok('090-1234-5678').domestic).toBe('090-1234-5678');
    expect(ok('090 1234 5678').domestic).toBe('090-1234-5678');
    expect(ok('(03) 1234.5678').domestic).toBe('03-1234-5678');
  });

  it('accepts full-width digits and hyphens', () => {
    expect(ok('０９０－１２３４－５６７８').domestic).toBe('090-1234-5678');
    expect(ok('090ー1234ー5678').domestic).toBe('090-1234-5678');
  });

  it('converts +81 and 0081 numbers, with or without the trunk 0', () => {
    expect(ok('+81 90 1234 5678')).toMatchObject({
      digits: '09012345678',
      domestic: '090-1234-5678',
    });
    expect(ok('+81 (0) 90-1234-5678').digits).toBe('09012345678');
    expect(ok('+81-3-1234-5678').domestic).toBe('03-1234-5678');
    expect(ok('0081 90 1234 5678').digits).toBe('09012345678');
    expect(ok('＋８１ ９０ １２３４ ５６７８').digits).toBe('09012345678');
  });

  it('keeps meaningful digits but does not group an unrecognized pattern', () => {
    expect(ok('0422123456')).toEqual({
      digits: '0422123456',
      domestic: null,
      international: null,
      kind: null,
    });
    expect(ok('09912345678').domestic).toBeNull();
  });

  it('rejects empty and blank input', () => {
    expect(formatPhoneNumber('')).toEqual({ ok: false, error: 'empty' });
    expect(formatPhoneNumber(' - ')).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects letters and stray symbols', () => {
    expect(formatPhoneNumber('090-ABCD-5678')).toEqual({ ok: false, error: 'invalid-characters' });
    expect(formatPhoneNumber('090#12345678')).toEqual({ ok: false, error: 'invalid-characters' });
    expect(formatPhoneNumber('090+12345678')).toEqual({ ok: false, error: 'invalid-characters' });
  });

  it('rejects wrong lengths and numbers without a leading 0', () => {
    expect(formatPhoneNumber('090123456')).toEqual({ ok: false, error: 'wrong-length' });
    expect(formatPhoneNumber('090123456789')).toEqual({ ok: false, error: 'wrong-length' });
    expect(formatPhoneNumber('9012345678')).toEqual({ ok: false, error: 'wrong-length' });
    expect(formatPhoneNumber('110')).toEqual({ ok: false, error: 'wrong-length' });
    expect(formatPhoneNumber('+81')).toEqual({ ok: false, error: 'wrong-length' });
  });

  it('rejects other countries', () => {
    expect(formatPhoneNumber('+1 415 555 0100')).toEqual({
      ok: false,
      error: 'not-a-japanese-number',
    });
  });
});
