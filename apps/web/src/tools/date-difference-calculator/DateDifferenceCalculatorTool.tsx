import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { DATE_DIFFERENCE_ERROR_MESSAGES, calculateDateDifference } from './logic';
import type { DateDifference } from './logic';

const plural = (n: number, unit: string) => `${n.toLocaleString()} ${unit}${n === 1 ? '' : 's'}`;

export function DateDifferenceCalculatorTool() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState<DateDifference | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCalculate() {
    const outcome = calculateDateDifference(startDate, endDate);
    if (!outcome.ok) {
      setResult(null);
      setError(DATE_DIFFERENCE_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function handleReset() {
    setStartDate('');
    setEndDate('');
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          required
        />
        <Input
          label="End date"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          required
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCalculate}>Calculate difference</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not calculate">
          {error}
        </Alert>
      )}

      {result && !error && (
        <div aria-live="polite" className="space-y-4">
          {result.reversed && (
            <Alert tone="info" title="The end date is before the start date">
              The dates were swapped, so the result below runs from {result.earlier} to{' '}
              {result.later}.
            </Alert>
          )}
          <div className="rounded-control border border-border bg-surface-muted p-4">
            <p className="text-sm font-semibold text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {plural(result.totalDays, 'day')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plural(result.weeks, 'week')} and {plural(result.extraDays, 'day')}
            </p>
          </div>
          <div className="rounded-control border border-border bg-surface-muted p-4">
            <p className="text-sm font-semibold text-muted-foreground">In years, months and days</p>
            <p className="mt-1 text-lg font-semibold">
              {plural(result.years, 'year')}, {plural(result.months, 'month')},{' '}
              {plural(result.days, 'day')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
