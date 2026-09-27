import { describe, expect, it } from 'vitest';
import { parseDecimal } from './parseDecimal';

describe('parseDecimal', () => {
  it('parses a plain integer', () => {
    expect(parseDecimal('42')).toBe(42);
  });

  it('parses a decimal', () => {
    expect(parseDecimal('3.14')).toBeCloseTo(3.14);
  });

  it('parses a negative number', () => {
    expect(parseDecimal('-7.5')).toBe(-7.5);
  });

  it('trims surrounding whitespace', () => {
    expect(parseDecimal('  10  ')).toBe(10);
  });

  it('returns undefined for empty input', () => {
    expect(parseDecimal('')).toBeUndefined();
  });

  it('returns undefined for whitespace-only input', () => {
    expect(parseDecimal('   ')).toBeUndefined();
  });

  it('returns undefined for non-numeric text', () => {
    expect(parseDecimal('abc')).toBeUndefined();
  });

  it('returns undefined for Infinity and NaN spellings', () => {
    expect(parseDecimal('Infinity')).toBeUndefined();
    expect(parseDecimal('NaN')).toBeUndefined();
  });

  it('accepts zero', () => {
    expect(parseDecimal('0')).toBe(0);
  });
});
