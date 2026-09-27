import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AGE_CALCULATOR_ERROR_MESSAGES, calculateAge } from './logic';
import type { AgeResult } from './logic';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function JapaneseAgeCalculatorTool() {
  const [birthDate, setBirthDate] = useState('');
  const [referenceDate, setReferenceDate] = useState(today);
  const [result, setResult] = useState<AgeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCalculate() {
    const outcome = calculateAge(birthDate, referenceDate);
    if (!outcome.ok) {
      setResult(null);
      setError(AGE_CALCULATOR_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function handleReset() {
    setBirthDate('');
    setReferenceDate(today());
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Date of birth"
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
        />
        <Input
          label="Reference date"
          type="date"
          value={referenceDate}
          onChange={(event) => setReferenceDate(event.target.value)}
          hint="Defaults to today; change it to calculate age on another date."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCalculate}>Calculate age</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not calculate age">
          {error}
        </Alert>
      )}

      {result && !error && (
        <div aria-live="polite" className="space-y-4">
          <div className="rounded-control border border-border bg-surface-muted p-4">
            <p className="text-sm font-semibold text-muted-foreground">Age</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {result.years} {result.years === 1 ? 'year' : 'years'}, {result.months}{' '}
              {result.months === 1 ? 'month' : 'months'}, {result.days}{' '}
              {result.days === 1 ? 'day' : 'days'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.totalDays.toLocaleString()} total days
            </p>
          </div>

          <div className="rounded-control border border-border bg-surface-muted p-4">
            <p className="text-sm font-semibold text-muted-foreground">Next birthday</p>
            {result.nextBirthday.daysUntil === 0 ? (
              <p className="mt-1 text-lg font-semibold">
                Today — turning {result.nextBirthday.turningAge}!
              </p>
            ) : (
              <p className="mt-1 text-lg font-semibold">
                {result.nextBirthday.date} — in {result.nextBirthday.daysUntil.toLocaleString()}{' '}
                {result.nextBirthday.daysUntil === 1 ? 'day' : 'days'}, turning{' '}
                {result.nextBirthday.turningAge}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
