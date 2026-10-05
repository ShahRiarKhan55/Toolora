import { describe, expect, it } from 'vitest';
import { convertTime, currentInZone, formatOffset, getTimeZones, isValidTimeZone } from './logic';

function convert(date: string, time: string, from: string, to: string) {
  const result = convertTime({ date, time, from, to });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('convertTime', () => {
  it('converts Tokyo to New York during daylight saving, crossing midnight', () => {
    const v = convert('2024-07-01', '12:00', 'Asia/Tokyo', 'America/New_York');
    expect(v.to).toMatchObject({ date: '2024-06-30', time: '23:00', offset: 'UTC-4' });
    expect(v.from).toMatchObject({ date: '2024-07-01', time: '12:00', offset: 'UTC+9' });
    expect(v.dayShift).toBe(-1);
    expect(v.utc).toBe('2024-07-01T03:00:00.000Z');
  });

  it('uses the standard-time offset for New York in winter', () => {
    const v = convert('2024-01-15', '09:00', 'America/New_York', 'Asia/Tokyo');
    expect(v.to).toMatchObject({ date: '2024-01-15', time: '23:00', offset: 'UTC+9' });
    expect(v.from.offset).toBe('UTC-5');
    expect(v.dayShift).toBe(0);
  });

  it('converts Tokyo to Dhaka (3 hours behind, no daylight saving)', () => {
    const v = convert('2024-03-04', '12:00', 'Asia/Tokyo', 'Asia/Dhaka');
    expect(v.to).toMatchObject({ date: '2024-03-04', time: '09:00', offset: 'UTC+6' });
  });

  it('converts to and from UTC', () => {
    expect(convert('2024-03-04', '00:30', 'Asia/Tokyo', 'UTC').to).toMatchObject({
      date: '2024-03-03',
      time: '15:30',
      offset: 'UTC',
    });
    expect(convert('2024-03-04', '15:30', 'UTC', 'Asia/Tokyo').to).toMatchObject({
      date: '2024-03-05',
      time: '00:30',
    });
    expect(convert('2024-03-04', '15:30', 'UTC', 'UTC').dayShift).toBe(0);
  });

  it('handles a half-hour offset', () => {
    expect(convert('2024-03-04', '12:00', 'UTC', 'Asia/Kolkata').to).toMatchObject({
      time: '17:30',
      offset: 'UTC+5:30',
    });
  });

  it('rejects a local time skipped by the spring-forward gap', () => {
    expect(
      convertTime({ date: '2024-03-10', time: '02:30', from: 'America/New_York', to: 'UTC' }),
    ).toEqual({
      ok: false,
      error: 'nonexistent-time',
    });
    // One hour either side is fine.
    expect(convert('2024-03-10', '01:30', 'America/New_York', 'UTC').utc).toBe(
      '2024-03-10T06:30:00.000Z',
    );
    expect(convert('2024-03-10', '03:30', 'America/New_York', 'UTC').utc).toBe(
      '2024-03-10T07:30:00.000Z',
    );
  });

  it('uses the earlier occurrence of a time repeated by the fall-back change, and flags it', () => {
    const v = convert('2024-11-03', '01:30', 'America/New_York', 'UTC');
    expect(v.ambiguous).toBe(true);
    expect(v.utc).toBe('2024-11-03T05:30:00.000Z');
    expect(convert('2024-11-03', '02:30', 'America/New_York', 'UTC').ambiguous).toBe(false);
  });

  it('reports the zone name', () => {
    expect(convert('2024-07-01', '12:00', 'Asia/Tokyo', 'Europe/London').to.zoneName).toMatch(
      /British Summer Time|GMT\+1/,
    );
  });

  it('validates input', () => {
    const ok = { date: '2024-03-04', time: '12:00', from: 'UTC', to: 'Asia/Tokyo' };
    expect(convertTime({ ...ok, date: '' })).toEqual({ ok: false, error: 'missing-date' });
    expect(convertTime({ ...ok, date: '2024-02-30' })).toEqual({
      ok: false,
      error: 'invalid-date',
    });
    expect(convertTime({ ...ok, date: '1800-01-01' })).toEqual({
      ok: false,
      error: 'year-out-of-range',
    });
    expect(convertTime({ ...ok, time: '' })).toEqual({ ok: false, error: 'missing-time' });
    expect(convertTime({ ...ok, time: '25:00' })).toEqual({ ok: false, error: 'invalid-time' });
    expect(convertTime({ ...ok, time: '12:60' })).toEqual({ ok: false, error: 'invalid-time' });
    expect(convertTime({ ...ok, time: 'noon' })).toEqual({ ok: false, error: 'invalid-time' });
    expect(convertTime({ ...ok, from: 'Mars/Olympus' })).toEqual({
      ok: false,
      error: 'invalid-zone',
    });
    expect(convertTime({ ...ok, to: '' })).toEqual({ ok: false, error: 'invalid-zone' });
  });
});

describe('time zone helpers', () => {
  it('lists runtime zones including the defaults and UTC', () => {
    const zones = getTimeZones();
    for (const zone of [
      'UTC',
      'Asia/Tokyo',
      'America/New_York',
      'Europe/London',
      'Asia/Dhaka',
      'Asia/Singapore',
    ]) {
      expect(zones).toContain(zone);
    }
    expect(new Set(zones).size).toBe(zones.length);
  });

  it('validates zone names', () => {
    expect(isValidTimeZone('Asia/Tokyo')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('formats offsets', () => {
    expect(formatOffset(0)).toBe('UTC');
    expect(formatOffset(540)).toBe('UTC+9');
    expect(formatOffset(-300)).toBe('UTC-5');
    expect(formatOffset(345)).toBe('UTC+5:45');
    expect(formatOffset(-210)).toBe('UTC-3:30');
  });

  it('reads the current local time of a zone from a fixed instant', () => {
    const now = Date.UTC(2024, 2, 4, 15, 30, 45);
    expect(currentInZone('Asia/Tokyo', now)).toEqual({ date: '2024-03-05', time: '00:30' });
    expect(currentInZone('UTC', now)).toEqual({ date: '2024-03-04', time: '15:30' });
  });
});
