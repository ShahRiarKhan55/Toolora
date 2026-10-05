import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { BUSINESS_DAYS_ERROR_MESSAGES, countBusinessDays } from './logic';
import type { BusinessDaysResult } from './logic';

const plural = (n: number, unit: string) =>
  `${n.toLocaleString('en-US')} ${unit}${n === 1 ? '' : 's'}`;

export function BusinessDaysCalculatorTool() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [includeStart, setIncludeStart] = useState(true);
  const [includeEnd, setIncludeEnd] = useState(true);
  const [result, setResult] = useState<BusinessDaysResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function calculate() {
    const outcome = countBusinessDays(start, end, { includeStart, includeEnd });
    if (!outcome.ok) {
      setResult(null);
      setError(BUSINESS_DAYS_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function reset() {
    setStart('');
    setEnd('');
    setIncludeStart(true);
    setIncludeEnd(true);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start date"
          type="date"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          required
        />
        <Input
          label="End date"
          type="date"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          required
        />
      </div>

      <fieldset className="space-y-1">
        <legend className="mb-1 text-sm font-semibold">Which days to count</legend>
        <Checkbox
          label="Include the start date"
          checked={includeStart}
          onChange={(event) => setIncludeStart(event.target.checked)}
        />
        <Checkbox
          label="Include the end date"
          checked={includeEnd}
          onChange={(event) => setIncludeEnd(event.target.checked)}
        />
      </fieldset>

      <p className="text-sm text-muted-foreground">
        Weekends are excluded; public holidays are not included.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button onClick={calculate}>Count business days</Button>
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not calculate">
          {error}
        </Alert>
      )}

      {result && !error && (
        <div className="space-y-4">
          {result.reversed && (
            <Alert tone="info" title="The end date is before the start date">
              The dates were swapped, so the count runs from {result.earlier} to {result.later}.
            </Alert>
          )}
          <ResultBox
            label="Business days"
            value={String(result.businessDays)}
            copyLabel="Copy business days"
          >
            {plural(result.businessDays, 'business day')}
          </ResultBox>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Total calendar days counted: {result.calendarDays.toLocaleString('en-US')}</li>
            <li>Weekend days excluded: {result.weekendDays.toLocaleString('en-US')}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
