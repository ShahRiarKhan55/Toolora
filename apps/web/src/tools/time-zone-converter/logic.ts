import { parseIsoDate } from '../../lib/isoDate';

/** Offered first in the pickers; the full runtime list follows. */
export const COMMON_TIME_ZONES = [
  'Asia/Tokyo',
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Dhaka',
  'Asia/Singapore',
] as const;

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export type TimeZoneError =
  | 'missing-date'
  | 'invalid-date'
  | 'year-out-of-range'
  | 'missing-time'
  | 'invalid-time'
  | 'invalid-zone'
  | 'nonexistent-time';

export const TIME_ZONE_ERROR_MESSAGES: Record<TimeZoneError, string> = {
  'missing-date': 'Enter a date.',
  'invalid-date': 'The date is not a valid date.',
  'year-out-of-range': `Use a year between ${MIN_YEAR} and ${MAX_YEAR}.`,
  'missing-time': 'Enter a time.',
  'invalid-time': 'The time is not valid. Use hours and minutes, such as 14:30.',
  'invalid-zone': 'Choose a time zone from the list.',
  'nonexistent-time':
    'That local time does not exist in the "From" time zone: the clocks skip it when daylight saving starts. Pick a different time.',
};

export function isValidTimeZone(zone: string): boolean {
  if (zone === '') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** IANA zones the runtime knows, always including UTC (some runtimes omit it from the list). */
export function getTimeZones(): string[] {
  const supported = Intl.supportedValuesOf('timeZone');
  return supported.includes('UTC') ? supported : ['UTC', ...supported];
}

interface Fields {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(zone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    formatterCache.set(zone, f);
  }
  return f;
}

/** Wall-clock fields of an instant in a zone, read from Intl (so daylight saving is the runtime's). */
function fieldsAt(utcMs: number, zone: string): Fields {
  const out: Record<string, number> = {};
  for (const part of formatter(zone).formatToParts(utcMs)) {
    if (part.type !== 'literal') out[part.type] = Number(part.value);
  }
  return {
    year: out.year!,
    month: out.month!,
    day: out.day!,
    hour: out.hour!,
    minute: out.minute!,
  };
}

const fieldsToUtcMs = (f: Fields) => Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute);

/** Offset from UTC in minutes at an instant (positive east of Greenwich). */
function offsetMinutes(utcMs: number, zone: string): number {
  return (fieldsToUtcMs(fieldsAt(utcMs, zone)) - utcMs) / 60_000;
}

export function formatOffset(minutes: number): string {
  if (minutes === 0) return 'UTC';
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
}

function zoneName(utcMs: number, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    timeZoneName: 'long',
  }).formatToParts(utcMs);
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? zone;
}

const pad = (n: number) => String(n).padStart(2, '0');
const DAY_MS = 86_400_000;

export interface ZonedMoment {
  zone: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, 24-hour */
  time: string;
  weekdayDate: string;
  offset: string;
  zoneName: string;
}

export interface TimeZoneConversion {
  from: ZonedMoment;
  to: ZonedMoment;
  /** Calendar-day difference of the result from the input (-1, 0 or 1 for real zones). */
  dayShift: number;
  /** The local time happens twice (clocks go back); the earlier occurrence was used. */
  ambiguous: boolean;
  utc: string;
}

function describe(utcMs: number, zone: string): ZonedMoment {
  const f = fieldsAt(utcMs, zone);
  const weekdayDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(Date.UTC(f.year, f.month - 1, f.day));
  return {
    zone,
    date: `${f.year}-${pad(f.month)}-${pad(f.day)}`,
    time: `${pad(f.hour)}:${pad(f.minute)}`,
    weekdayDate,
    offset: formatOffset(offsetMinutes(utcMs, zone)),
    zoneName: zoneName(utcMs, zone),
  };
}

export function convertTime(input: {
  date: string;
  time: string;
  from: string;
  to: string;
}): { ok: true; value: TimeZoneConversion } | { ok: false; error: TimeZoneError } {
  if (input.date.trim() === '') return { ok: false, error: 'missing-date' };
  const date = parseIsoDate(input.date);
  if (!date) return { ok: false, error: 'invalid-date' };
  if (date.year < MIN_YEAR || date.year > MAX_YEAR)
    return { ok: false, error: 'year-out-of-range' };
  if (input.time.trim() === '') return { ok: false, error: 'missing-time' };
  const match = /^(\d{2}):(\d{2})$/.exec(input.time.trim());
  const hour = match ? Number(match[1]) : NaN;
  const minute = match ? Number(match[2]) : NaN;
  if (!match || hour > 23 || minute > 59) return { ok: false, error: 'invalid-time' };
  if (!isValidTimeZone(input.from) || !isValidTimeZone(input.to)) {
    return { ok: false, error: 'invalid-zone' };
  }

  const wanted: Fields = { ...date, hour, minute };
  const asIfUtc = fieldsToUtcMs(wanted);
  // The zone's offset a day either side brackets any transition near the wanted wall-clock time;
  // keep each candidate instant that really reads back as the wanted time.
  const candidates = new Set(
    [asIfUtc - DAY_MS, asIfUtc + DAY_MS]
      .map((t) => asIfUtc - offsetMinutes(t, input.from) * 60_000)
      .filter((utc) => fieldsToUtcMs(fieldsAt(utc, input.from)) === asIfUtc),
  );
  if (candidates.size === 0) return { ok: false, error: 'nonexistent-time' };
  const utcMs = Math.min(...candidates);

  const from = describe(utcMs, input.from);
  const to = describe(utcMs, input.to);
  const dayOf = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  return {
    ok: true,
    value: {
      from,
      to,
      dayShift: Math.round((dayOf(to.date) - dayOf(from.date)) / DAY_MS),
      ambiguous: candidates.size > 1,
      utc: new Date(utcMs).toISOString(),
    },
  };
}

/** Current date and time in a zone, as the `YYYY-MM-DD` / `HH:MM` strings the inputs use. */
export function currentInZone(
  zone: string,
  now: number = Date.now(),
): { date: string; time: string } {
  const f = fieldsAt(Math.floor(now / 60_000) * 60_000, zone);
  return {
    date: `${f.year}-${pad(f.month)}-${pad(f.day)}`,
    time: `${pad(f.hour)}:${pad(f.minute)}`,
  };
}
