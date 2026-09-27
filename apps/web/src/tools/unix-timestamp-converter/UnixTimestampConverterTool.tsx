import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import type { TimestampUnit } from './logic';
import {
  DATE_TO_TIMESTAMP_ERROR_MESSAGES,
  dateToTimestamp,
  TIMESTAMP_TO_DATE_ERROR_MESSAGES,
  timestampToDate,
} from './logic';

function TimestampToDateForm() {
  const [timestamp, setTimestamp] = useState('');
  const [unit, setUnit] = useState<TimestampUnit>('seconds');
  const [result, setResult] = useState<{ utcIso: string; local: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConvert() {
    const outcome = timestampToDate(timestamp, unit);
    if (!outcome.ok) {
      setResult(null);
      setError(TIMESTAMP_TO_DATE_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult({
      utcIso: outcome.value.utcIso,
      local: new Date(outcome.value.epochMs).toLocaleString(),
    });
  }

  function useNow() {
    const now = unit === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now();
    setTimestamp(String(now));
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Timestamp → date</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Unix timestamp"
          inputMode="decimal"
          value={timestamp}
          onChange={(event) => setTimestamp(event.target.value)}
        />
        <Select
          label="Unit"
          value={unit}
          onChange={(event) => setUnit(event.target.value as TimestampUnit)}
        >
          <option value="seconds">Seconds</option>
          <option value="milliseconds">Milliseconds</option>
        </Select>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleConvert}>Convert</Button>
        <Button variant="secondary" onClick={useNow}>
          Use current time
        </Button>
      </div>
      {error && (
        <Alert tone="error" title="Could not convert">
          {error}
        </Alert>
      )}
      {result && !error && (
        <div className="space-y-2">
          <ResultBox label="Local time" value={result.local} copyLabel="Copy local time" />
          <ResultBox label="UTC" value={result.utcIso} copyLabel="Copy UTC" />
        </div>
      )}
    </div>
  );
}

function DateToTimestampForm() {
  const [dateTime, setDateTime] = useState('');
  const [result, setResult] = useState<{ seconds: string; milliseconds: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConvert() {
    const outcome = dateToTimestamp(dateTime);
    if (!outcome.ok) {
      setResult(null);
      setError(DATE_TO_TIMESTAMP_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult({
      seconds: String(outcome.value.seconds),
      milliseconds: String(outcome.value.milliseconds),
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Date → timestamp</h2>
      <Input
        label="Date & time (UTC)"
        type="datetime-local"
        value={dateTime}
        onChange={(event) => setDateTime(event.target.value)}
        hint="Entered and interpreted as UTC, not your local timezone."
      />
      <Button onClick={handleConvert}>Convert</Button>
      {error && (
        <Alert tone="error" title="Could not convert">
          {error}
        </Alert>
      )}
      {result && !error && (
        <div className="space-y-2">
          <ResultBox label="Seconds" value={result.seconds} copyLabel="Copy seconds" />
          <ResultBox
            label="Milliseconds"
            value={result.milliseconds}
            copyLabel="Copy milliseconds"
          />
        </div>
      )}
    </div>
  );
}

export function UnixTimestampConverterTool() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <TimestampToDateForm />
      <DateToTimestampForm />
    </div>
  );
}
