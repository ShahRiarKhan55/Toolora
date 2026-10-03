import { describe, expect, it } from 'vitest';
import { formatPostalCode } from './logic';

describe('formatPostalCode', () => {
  it('formats seven digits', () => {
    expect(formatPostalCode('1000001')).toEqual({ ok: true, value: '100-0001' });
  });

  it('keeps an already formatted code', () => {
    expect(formatPostalCode('100-0001')).toEqual({ ok: true, value: '100-0001' });
  });

  it('trims and accepts spaces around or in place of the hyphen', () => {
    expect(formatPostalCode('  100-0001  ')).toEqual({ ok: true, value: '100-0001' });
    expect(formatPostalCode('100 0001')).toEqual({ ok: true, value: '100-0001' });
    expect(formatPostalCode('100 - 0001')).toEqual({ ok: true, value: '100-0001' });
  });

  it('accepts a leading 〒', () => {
    expect(formatPostalCode('〒100-0001')).toEqual({ ok: true, value: '100-0001' });
    expect(formatPostalCode('〒 1000001')).toEqual({ ok: true, value: '100-0001' });
  });

  it('accepts full-width digits and hyphen variants', () => {
    expect(formatPostalCode('１００－０００１')).toEqual({ ok: true, value: '100-0001' });
    expect(formatPostalCode('100−0001')).toEqual({ ok: true, value: '100-0001' });
    expect(formatPostalCode('100ー0001')).toEqual({ ok: true, value: '100-0001' });
  });

  it('keeps leading zeros', () => {
    expect(formatPostalCode('0600000')).toEqual({ ok: true, value: '060-0000' });
  });

  it('rejects empty and blank input', () => {
    expect(formatPostalCode('')).toEqual({ ok: false, error: 'empty' });
    expect(formatPostalCode('   ')).toEqual({ ok: false, error: 'empty' });
    expect(formatPostalCode('〒')).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects too few and too many digits', () => {
    expect(formatPostalCode('100-000')).toEqual({ ok: false, error: 'too-few-digits' });
    expect(formatPostalCode('123456')).toEqual({ ok: false, error: 'too-few-digits' });
    expect(formatPostalCode('10000011')).toEqual({ ok: false, error: 'too-many-digits' });
    expect(formatPostalCode('100-00011')).toEqual({ ok: false, error: 'too-many-digits' });
  });

  it('rejects letters and other characters', () => {
    expect(formatPostalCode('100-000A')).toEqual({ ok: false, error: 'invalid-characters' });
    expect(formatPostalCode('abcdefg')).toEqual({ ok: false, error: 'invalid-characters' });
    expect(formatPostalCode('100/0001')).toEqual({ ok: false, error: 'invalid-characters' });
  });

  it('rejects seven digits with a misplaced separator', () => {
    expect(formatPostalCode('1000-001')).toEqual({ ok: false, error: 'misplaced-separator' });
    expect(formatPostalCode('10 00001')).toEqual({ ok: false, error: 'misplaced-separator' });
  });

  it('only checks the format, so an unassigned code is accepted', () => {
    expect(formatPostalCode('000-0000')).toEqual({ ok: true, value: '000-0000' });
  });
});
