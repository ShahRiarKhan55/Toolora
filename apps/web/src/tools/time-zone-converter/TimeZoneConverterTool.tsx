import { useMemo, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import {
  COMMON_TIME_ZONES,
  TIME_ZONE_ERROR_MESSAGES,
  convertTime,
  currentInZone,
  getTimeZones,
} from './logic';

function ZoneOptions({ zones }: { zones: readonly string[] }) {
  const common = COMMON_TIME_ZONES.filter((zone) => zones.includes(zone));
  return (
    <>
      <optgroup label="Common">
        {common.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </optgroup>
      <optgroup label="All time zones">
        {zones.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </optgroup>
    </>
  );
}

export function TimeZoneConverterTool() {
  const zones = useMemo(() => getTimeZones(), []);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [from, setFrom] = useState('Asia/Tokyo');
  const [to, setTo] = useState('America/New_York');

  // Live result, but no error until the user has typed both a date and a time.
  const outcome = useMemo(
    () => (date === '' && time === '' ? null : convertTime({ date, time, from, to })),
    [date, time, from, to],
  );
  const incomplete = outcome && !outcome.ok && (date === '' || time === '');

  function useNow() {
    const now = currentInZone(from);
    setDate(now.date);
    setTime(now.time);
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function reset() {
    setDate('');
    setTime('');
    setFrom('Asia/Tokyo');
    setTo('America/New_York');
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Date (in the From time zone)"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Input
          label="Time (24-hour)"
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
        />
        <Select
          label="From time zone"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        >
          <ZoneOptions zones={zones} />
        </Select>
        <Select label="To time zone" value={to} onChange={(event) => setTo(event.target.value)}>
          <ZoneOptions zones={zones} />
        </Select>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={swap}>
          Swap time zones
        </Button>
        <Button variant="secondary" onClick={useNow}>
          Use current time in {from}
        </Button>
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
      </div>

      {outcome && !outcome.ok && !incomplete && (
        <Alert tone="error" title="Could not convert">
          {TIME_ZONE_ERROR_MESSAGES[outcome.error]}
        </Alert>
      )}

      {outcome?.ok && (
        <div className="space-y-4">
          <ResultBox
            label={`In ${outcome.value.to.zone}`}
            value={`${outcome.value.to.date} ${outcome.value.to.time}`}
            copyLabel="Copy converted time"
          >
            <span>
              {outcome.value.to.time}
              <span className="ml-2 text-base font-semibold text-muted-foreground">
                {outcome.value.to.weekdayDate}
              </span>
            </span>
          </ResultBox>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              {outcome.value.from.zone}: {outcome.value.from.zoneName} ({outcome.value.from.offset})
            </li>
            <li>
              {outcome.value.to.zone}: {outcome.value.to.zoneName} ({outcome.value.to.offset})
            </li>
            {outcome.value.dayShift !== 0 && (
              <li>
                The result is {Math.abs(outcome.value.dayShift)} day
                {Math.abs(outcome.value.dayShift) === 1 ? '' : 's'}{' '}
                {outcome.value.dayShift < 0 ? 'before' : 'after'} the date you entered.
              </li>
            )}
          </ul>
          {outcome.value.ambiguous && (
            <Alert tone="warning" title="This local time happens twice">
              Clocks go back in {outcome.value.from.zone} and this time occurs twice that day. The
              earlier one (before the change) was used.
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
