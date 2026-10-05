import { CURRENCY_CODES } from '@toolora/shared';
import { describe, expect, it } from 'vitest';
import {
  buildCopyText,
  currencyLabel,
  formatAmount,
  formatRate,
  parseAmount,
  POPULAR_PAIRS,
  rateDate,
  sourceName,
} from './logic';

describe('parseAmount', () => {
  it('accepts plain, decimal and thousands-grouped numbers', () => {
    expect(parseAmount('10000')).toEqual({ ok: true, value: 10000 });
    expect(parseAmount(' 2500.50 ')).toEqual({ ok: true, value: 2500.5 });
    expect(parseAmount('100,000')).toEqual({ ok: true, value: 100000 });
    expect(parseAmount('1,234,567.89')).toEqual({ ok: true, value: 1234567.89 });
    expect(parseAmount('0')).toEqual({ ok: true, value: 0 });
  });

  it('rejects empty input', () => {
    expect(parseAmount('')).toEqual({ ok: false, error: 'empty' });
    expect(parseAmount('   ')).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects malformed and non-finite values', () => {
    for (const bad of ['abc', '1,5', '12,34', '1e999', 'Infinity', 'NaN', '1..2', '10 000']) {
      expect(parseAmount(bad), bad).toEqual({ ok: false, error: 'invalid' });
    }
  });

  it('rejects negatives', () => {
    expect(parseAmount('-1')).toEqual({ ok: false, error: 'negative' });
  });

  it('enforces the maximum at the boundary', () => {
    expect(parseAmount('1000000000000')).toEqual({ ok: true, value: 1e12 });
    expect(parseAmount('1000000000001')).toEqual({ ok: false, error: 'too-large' });
  });
});

describe('formatting', () => {
  it('uses each currency’s own decimal places from 1 upwards', () => {
    expect(formatAmount(100000, 'JPY')).toBe('100,000 JPY');
    expect(formatAmount(1234.5, 'USD')).toBe('1,234.50 USD');
    expect(formatAmount(0, 'JPY')).toBe('0 JPY');
  });

  it('keeps significant digits below 1 instead of rounding to a misleading cent', () => {
    expect(formatAmount(0.00671, 'USD')).toBe('0.00671 USD');
  });

  it('formats rates with up to six significant digits', () => {
    expect(formatRate('JPY', 'BDT', 0.8123456)).toBe('1 JPY = 0.812346 BDT');
    expect(formatRate('USD', 'JPY', 150.1234567)).toBe('1 USD = 150.123 JPY');
  });

  it('labels every supported currency with code, name and symbol', () => {
    for (const code of CURRENCY_CODES)
      expect(currencyLabel(code)).toMatch(new RegExp(`^${code} — `));
    expect(currencyLabel('JPY')).toBe('JPY — Japanese Yen (¥)');
  });
});

describe('source and date', () => {
  it('names known providers truthfully and never defaults to ExchangeRate-API', () => {
    expect(sourceName('exchangerate-api')).toBe('ExchangeRate-API');
    expect(sourceName('fawazahmed0')).toBe('fawazahmed0 currency-api');
    expect(sourceName('mystery')).not.toMatch(/ExchangeRate/);
  });

  it('takes the UTC date from the provider timestamp', () => {
    expect(rateDate('2026-10-05T00:02:31.000Z')).toBe('2026-10-05');
  });
});

describe('buildCopyText', () => {
  it('lists the conversion, rate, rate date and source from the quote', () => {
    const text = buildCopyText({
      amount: 100000,
      from: 'JPY',
      to: 'BDT',
      rate: 0.8,
      updatedAt: '2026-10-05T00:02:31.000Z',
      source: 'fawazahmed0',
    });
    expect(text).toBe(
      [
        '100,000 JPY = 80,000.00 BDT',
        'Rate: 1 JPY = 0.8 BDT',
        'Daily reference rate: 2026-10-05',
        'Source: fawazahmed0 currency-api',
      ].join('\n'),
    );
  });
});

describe('POPULAR_PAIRS', () => {
  it('contains the twelve requested pairs, all supported and none identical', () => {
    expect(POPULAR_PAIRS).toHaveLength(12);
    for (const { from, to } of POPULAR_PAIRS) {
      expect(CURRENCY_CODES).toContain(from);
      expect(CURRENCY_CODES).toContain(to);
      expect(from).not.toBe(to);
    }
    expect(POPULAR_PAIRS[0]).toEqual({ from: 'JPY', to: 'BDT' });
  });
});
