import { describe, expect, it } from 'vitest';
import { eraToGregorian, ERAS, gregorianToEra } from './logic';

describe('gregorianToEra', () => {
  it('converts a normal Reiwa date', () => {
    const result = gregorianToEra('2024-01-01');
    expect(result).toEqual({ ok: true, value: { era: ERAS[4], eraYear: 6 } });
  });

  it('finds the exact start of an era (Heisei)', () => {
    const result = gregorianToEra('1989-01-08');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ era: ERAS[3], eraYear: 1 });
  });

  it('finds the day before, still in the previous era (Showa 64)', () => {
    const result = gregorianToEra('1989-01-07');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ era: ERAS[2], eraYear: 64 });
  });

  it('finds the exact end of an era (Taisho 15)', () => {
    const result = gregorianToEra('1926-12-24');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ era: ERAS[1], eraYear: 15 });
  });

  it('finds the earliest supported date (Meiji 1)', () => {
    const result = gregorianToEra('1868-10-23');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ era: ERAS[0], eraYear: 1 });
  });

  it('rejects the day before the earliest supported date', () => {
    expect(gregorianToEra('1868-10-22')).toEqual({ ok: false, error: 'before-supported-range' });
  });

  it('rejects a date far in the past', () => {
    expect(gregorianToEra('1500-01-01')).toEqual({ ok: false, error: 'before-supported-range' });
  });

  it('accepts a far-future date under the current, open-ended era', () => {
    const result = gregorianToEra('2100-01-01');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.era.id).toBe('reiwa');
  });

  it('rejects an empty date', () => {
    expect(gregorianToEra('')).toEqual({ ok: false, error: 'invalid-date' });
  });

  it('rejects a malformed date string', () => {
    expect(gregorianToEra('not-a-date')).toEqual({ ok: false, error: 'invalid-date' });
  });

  it('rejects a calendar-invalid date (30 February)', () => {
    expect(gregorianToEra('2024-02-30')).toEqual({ ok: false, error: 'invalid-date' });
  });

  it('accepts a leap-day date', () => {
    const result = gregorianToEra('2024-02-29');
    expect(result.ok).toBe(true);
  });
});

describe('eraToGregorian', () => {
  it('converts a normal Reiwa year', () => {
    const result = eraToGregorian('reiwa', '6');
    expect(result).toEqual({
      ok: true,
      value: { era: ERAS[4], eraYear: 6, gregorianYear: 2024, isPartialYear: false },
    });
  });

  it('marks the first year of an era as partial', () => {
    const result = eraToGregorian('reiwa', '1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.gregorianYear).toBe(2019);
      expect(result.value.isPartialYear).toBe(true);
    }
  });

  it('marks the final year of a bounded era as partial (Showa 64)', () => {
    const result = eraToGregorian('showa', '64');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.gregorianYear).toBe(1989);
      expect(result.value.isPartialYear).toBe(true);
    }
  });

  it('does not mark a mid-era year as partial', () => {
    const result = eraToGregorian('showa', '30');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.isPartialYear).toBe(false);
  });

  it('rejects an era year beyond a bounded era (Showa 65)', () => {
    expect(eraToGregorian('showa', '65')).toEqual({ ok: false, error: 'year-out-of-range' });
  });

  it('accepts the last valid year of Meiji (45)', () => {
    const result = eraToGregorian('meiji', '45');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.gregorianYear).toBe(1912);
  });

  it('rejects an era year of zero', () => {
    expect(eraToGregorian('reiwa', '0')).toEqual({ ok: false, error: 'invalid-year' });
  });

  it('rejects a negative era year', () => {
    expect(eraToGregorian('reiwa', '-1')).toEqual({ ok: false, error: 'invalid-year' });
  });

  it('rejects a non-integer era year', () => {
    expect(eraToGregorian('reiwa', '1.5')).toEqual({ ok: false, error: 'invalid-year' });
  });

  it('rejects a non-numeric era year', () => {
    expect(eraToGregorian('reiwa', 'abc')).toEqual({ ok: false, error: 'invalid-year' });
  });

  it('rejects an empty era year', () => {
    expect(eraToGregorian('reiwa', '')).toEqual({ ok: false, error: 'invalid-year' });
  });

  it('rejects an unknown era id', () => {
    expect(eraToGregorian('edo', '1')).toEqual({ ok: false, error: 'unknown-era' });
  });

  it('never lets an unbounded era (Reiwa) hit year-out-of-range', () => {
    const result = eraToGregorian('reiwa', '500');
    expect(result.ok).toBe(true);
  });
});
