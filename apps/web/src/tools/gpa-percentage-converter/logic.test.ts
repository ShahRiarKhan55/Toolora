import { describe, expect, it } from 'vitest';
import { gpaToPercentage, percentageToGpa } from './logic';

describe('gpaToPercentage', () => {
  it('converts on a 4.0 scale', () => {
    expect(gpaToPercentage('4', 4)).toEqual({ ok: true, value: 100 });
    expect(gpaToPercentage('3.5', 4)).toEqual({ ok: true, value: 87.5 });
    expect(gpaToPercentage('2', 4)).toEqual({ ok: true, value: 50 });
  });

  it('converts on 5.0 and 10-point scales', () => {
    expect(gpaToPercentage('4', 5)).toEqual({ ok: true, value: 80 });
    expect(gpaToPercentage('8.5', 10)).toEqual({ ok: true, value: 85 });
  });

  it('accepts both boundaries', () => {
    expect(gpaToPercentage('0', 4)).toEqual({ ok: true, value: 0 });
    expect(gpaToPercentage('10', 10)).toEqual({ ok: true, value: 100 });
  });

  it('rounds to two decimals', () => {
    expect(gpaToPercentage('3.33', 4)).toEqual({ ok: true, value: 83.25 });
    expect(gpaToPercentage('3.1', 4)).toEqual({ ok: true, value: 77.5 });
    expect(gpaToPercentage('3.7', 10)).toEqual({ ok: true, value: 37 });
    expect(gpaToPercentage('1', 3)).toMatchObject({ ok: false, error: 'unknown-scale' });
  });

  it('rejects above the scale maximum and below zero', () => {
    expect(gpaToPercentage('4.01', 4)).toMatchObject({ ok: false, error: 'out-of-range' });
    expect(gpaToPercentage('-0.1', 4)).toMatchObject({ ok: false, error: 'out-of-range' });
  });

  it('rejects empty, non-numeric and non-finite input', () => {
    expect(gpaToPercentage('', 4)).toMatchObject({ ok: false, error: 'empty' });
    expect(gpaToPercentage('   ', 4)).toMatchObject({ ok: false, error: 'empty' });
    expect(gpaToPercentage('abc', 4)).toMatchObject({ ok: false, error: 'not-a-number' });
    expect(gpaToPercentage('Infinity', 4)).toMatchObject({ ok: false, error: 'not-a-number' });
  });
});

describe('percentageToGpa', () => {
  it('converts back using the same proportion', () => {
    expect(percentageToGpa('87.5', 4)).toEqual({ ok: true, value: 3.5 });
    expect(percentageToGpa('80', 5)).toEqual({ ok: true, value: 4 });
    expect(percentageToGpa('85', 10)).toEqual({ ok: true, value: 8.5 });
  });

  it('accepts 0 and 100 and rejects outside them', () => {
    expect(percentageToGpa('0', 4)).toEqual({ ok: true, value: 0 });
    expect(percentageToGpa('100', 4)).toEqual({ ok: true, value: 4 });
    expect(percentageToGpa('100.5', 4)).toMatchObject({ ok: false, error: 'out-of-range' });
    expect(percentageToGpa('-1', 4)).toMatchObject({ ok: false, error: 'out-of-range' });
  });

  it('rejects empty and non-numeric input', () => {
    expect(percentageToGpa('', 4)).toMatchObject({ ok: false, error: 'empty' });
    expect(percentageToGpa('x', 4)).toMatchObject({ ok: false, error: 'not-a-number' });
  });
});
