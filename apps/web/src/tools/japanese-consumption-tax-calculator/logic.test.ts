import { describe, expect, it } from 'vitest';
import { calculateTax, formatYen, MAX_TAX_AMOUNT } from './logic';
import type { Rounding, TaxMode, TaxRate } from './logic';

function run(amount: string, rate: TaxRate, mode: TaxMode, rounding: Rounding = 'floor') {
  const outcome = calculateTax({ amount, rate, mode, rounding });
  if (!outcome.ok) throw new Error(`unexpected error ${outcome.error}`);
  return outcome.value;
}

describe('calculateTax — tax-exclusive input', () => {
  it('adds 10% to a pre-tax amount', () => {
    expect(run('1000', 10, 'exclusive')).toEqual({ rate: 10, preTax: 1000, tax: 100, total: 1100 });
  });

  it('adds 8% (reduced rate) to a pre-tax amount', () => {
    expect(run('1000', 8, 'exclusive')).toEqual({ rate: 8, preTax: 1000, tax: 80, total: 1080 });
  });

  it('handles zero', () => {
    expect(run('0', 10, 'exclusive')).toEqual({ rate: 10, preTax: 0, tax: 0, total: 0 });
    expect(run('0.00', 8, 'inclusive')).toEqual({ rate: 8, preTax: 0, tax: 0, total: 0 });
  });

  it('supports decimal amounts without floating-point artifacts', () => {
    // 0.1 + 0.2 style traps: 1980.10 at 10% is 198.01 → tax 198 yen.
    expect(run('1980.10', 10, 'exclusive')).toEqual({
      rate: 10,
      preTax: 1980.1,
      tax: 198,
      total: 2178.1,
    });
  });

  it('applies the rounding choice to the tax', () => {
    // 99 yen at 8% is 7.92 yen of tax.
    expect(run('99', 8, 'exclusive', 'floor').tax).toBe(7);
    expect(run('99', 8, 'exclusive', 'round').tax).toBe(8);
    expect(run('99', 8, 'exclusive', 'ceil').tax).toBe(8);
    // 105 yen at 10% is 10.5 exactly: half rounds up, floor drops, ceil rises.
    expect(run('105', 10, 'exclusive', 'floor').tax).toBe(10);
    expect(run('105', 10, 'exclusive', 'round').tax).toBe(11);
    expect(run('105', 10, 'exclusive', 'ceil').tax).toBe(11);
  });

  it('does not round a figure that is already exact', () => {
    for (const rounding of ['floor', 'round', 'ceil'] as const) {
      expect(run('500', 10, 'exclusive', rounding).tax).toBe(50);
    }
  });
});

describe('calculateTax — tax-inclusive input', () => {
  it('splits a 10% tax-inclusive amount', () => {
    expect(run('1100', 10, 'inclusive')).toEqual({ rate: 10, preTax: 1000, tax: 100, total: 1100 });
  });

  it('splits an 8% tax-inclusive amount', () => {
    expect(run('1080', 8, 'inclusive')).toEqual({ rate: 8, preTax: 1000, tax: 80, total: 1080 });
  });

  it('always keeps pre-tax + tax equal to the total', () => {
    for (const amount of ['1', '99', '101', '1234', '98765']) {
      for (const rate of [8, 10] as const) {
        for (const rounding of ['floor', 'round', 'ceil'] as const) {
          const r = run(amount, rate, 'inclusive', rounding);
          expect(r.preTax + r.tax).toBe(r.total);
        }
      }
    }
  });

  it('rounds the tax contained in an inclusive amount', () => {
    // 100 yen incl. 10% contains 9.0909… yen of tax.
    expect(run('100', 10, 'inclusive', 'floor').tax).toBe(9);
    expect(run('100', 10, 'inclusive', 'round').tax).toBe(9);
    expect(run('100', 10, 'inclusive', 'ceil').tax).toBe(10);
    expect(run('100', 10, 'inclusive', 'ceil').preTax).toBe(90);
  });

  it('accepts thousands separators and surrounding spaces', () => {
    expect(run(' 1,100 ', 10, 'inclusive').preTax).toBe(1000);
  });

  it('accepts a leading or trailing decimal point', () => {
    expect(run('.5', 10, 'exclusive').total).toBe(0.5);
    expect(run('10.', 10, 'exclusive').total).toBe(11);
  });
});

describe('calculateTax — invalid input and boundaries', () => {
  const fail = (amount: string) => {
    const outcome = calculateTax({ amount, rate: 10, mode: 'exclusive', rounding: 'floor' });
    return outcome.ok ? null : outcome.error;
  };

  it('rejects empty input', () => {
    expect(fail('')).toBe('empty');
    expect(fail('   ')).toBe('empty');
  });

  it('rejects text, exponents and non-finite values', () => {
    for (const bad of ['abc', '1e3', 'Infinity', 'NaN', '.', '1.2.3', '12円', '1 000']) {
      expect(fail(bad)).toBe('invalid');
    }
  });

  it('rejects negative amounts', () => {
    expect(fail('-1')).toBe('negative');
    expect(fail('-0')).toBe('negative');
  });

  it('rejects more than 2 decimal places', () => {
    expect(fail('1.001')).toBe('too-precise');
  });

  it('accepts the largest supported amount and rejects one beyond it', () => {
    expect(fail(String(MAX_TAX_AMOUNT))).toBeNull();
    expect(fail(String(MAX_TAX_AMOUNT + 1))).toBe('too-large');
    expect(run(String(MAX_TAX_AMOUNT), 10, 'exclusive').tax).toBe(99_999_999_999);
  });
});

describe('formatYen', () => {
  it('formats whole yen without decimals and keeps real fractions', () => {
    expect(formatYen(1100)).toBe('¥1,100');
    expect(formatYen(0)).toBe('¥0');
    expect(formatYen(2178.1)).toBe('¥2,178.1');
    expect(formatYen(1234567)).toBe('¥1,234,567');
  });
});
