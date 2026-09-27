import { describe, expect, it } from 'vitest';
import { convertYen } from './logic';

describe('convertYen', () => {
  it('converts a normal amount', () => {
    const result = convertYen('10000', '0.0067');
    expect(result).toEqual({
      ok: true,
      value: { amountYen: 10000, ratePerYen: 0.0067, converted: 67 },
    });
  });

  it('accepts a zero amount', () => {
    const result = convertYen('0', '0.0067');
    expect(result).toEqual({ ok: true, value: { amountYen: 0, ratePerYen: 0.0067, converted: 0 } });
  });

  it('accepts a zero rate', () => {
    const result = convertYen('100', '0');
    expect(result).toEqual({ ok: true, value: { amountYen: 100, ratePerYen: 0, converted: 0 } });
  });

  it('accepts a decimal amount', () => {
    const result = convertYen('1500.5', '1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.converted).toBeCloseTo(1500.5);
  });

  it('handles a very large amount', () => {
    const result = convertYen('1000000000', '0.0067');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.converted).toBeCloseTo(6700000);
  });

  it('rejects a blank amount', () => {
    expect(convertYen('', '0.0067')).toEqual({ ok: false, error: 'invalid-amount' });
  });

  it('rejects a whitespace-only amount', () => {
    expect(convertYen('   ', '0.0067')).toEqual({ ok: false, error: 'invalid-amount' });
  });

  it('rejects a non-numeric amount', () => {
    expect(convertYen('abc', '0.0067')).toEqual({ ok: false, error: 'invalid-amount' });
  });

  it('rejects a negative amount', () => {
    expect(convertYen('-5', '0.0067')).toEqual({ ok: false, error: 'negative-amount' });
  });

  it('rejects a blank rate', () => {
    expect(convertYen('100', '')).toEqual({ ok: false, error: 'invalid-rate' });
  });

  it('rejects a non-numeric rate', () => {
    expect(convertYen('100', 'xyz')).toEqual({ ok: false, error: 'invalid-rate' });
  });

  it('rejects a negative rate', () => {
    expect(convertYen('100', '-1')).toEqual({ ok: false, error: 'negative-rate' });
  });

  it('checks the amount before the rate when both are invalid', () => {
    expect(convertYen('', '')).toEqual({ ok: false, error: 'invalid-amount' });
  });
});
