import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import {
  PERCENT_ERROR_MESSAGES,
  PERCENT_MODES,
  calculatePercentage,
  formatPercentNumber,
} from './logic';
import type { PercentMode, PercentResult } from './logic';

type Direction = 'increase' | 'decrease';

const FIELDS: Record<PercentMode, { x: string; y: string; xHint: string; yHint: string }> = {
  of: { x: 'Percentage (X%)', y: 'Of this value (Y)', xHint: 'e.g. 15', yHint: 'e.g. 80' },
  'what-percent': { x: 'Part (X)', y: 'Whole (Y)', xHint: 'e.g. 25', yHint: 'e.g. 200' },
  change: { x: 'Old value (X)', y: 'New value (Y)', xHint: 'e.g. 50', yHint: 'e.g. 75' },
  adjust: { x: 'Starting value (X)', y: 'Percentage (Y%)', xHint: 'e.g. 200', yHint: 'e.g. 10' },
};

function describe(mode: PercentMode, x: string, y: string, direction: Direction, r: PercentResult) {
  const value = formatPercentNumber(r.value);
  switch (mode) {
    case 'of':
      return `${x}% of ${y} is ${value}`;
    case 'what-percent':
      return `${x} is ${value}% of ${y}`;
    case 'change':
      return r.trend === 'none'
        ? 'No change'
        : `${r.trend === 'increase' ? 'Increase' : 'Decrease'} of ${formatPercentNumber(Math.abs(r.value))}%`;
    case 'adjust':
      return `${x} ${direction === 'increase' ? 'increased' : 'decreased'} by ${y}% is ${value}`;
  }
}

export function PercentageCalculatorTool() {
  const [mode, setMode] = useState<PercentMode>('of');
  const [direction, setDirection] = useState<Direction>('increase');
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [result, setResult] = useState<{ result: PercentResult; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fields = FIELDS[mode];

  function calculate() {
    const outcome = calculatePercentage({ mode, x, y, direction });
    if (!outcome.ok) {
      setResult(null);
      setError(PERCENT_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult({
      result: outcome.value,
      summary: describe(mode, x.trim(), y.trim(), direction, outcome.value),
    });
  }

  function changeMode(next: PercentMode) {
    setMode(next);
    setResult(null);
    setError(null);
  }

  function reset() {
    setX('');
    setY('');
    setDirection('increase');
    setResult(null);
    setError(null);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        calculate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="What do you want to work out?"
          value={mode}
          onChange={(event) => changeMode(event.target.value as PercentMode)}
          className="sm:col-span-2"
        >
          {PERCENT_MODES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          label={fields.x}
          inputMode="decimal"
          value={x}
          onChange={(event) => setX(event.target.value)}
          placeholder={fields.xHint}
        />
        <Input
          label={fields.y}
          inputMode="decimal"
          value={y}
          onChange={(event) => setY(event.target.value)}
          placeholder={fields.yHint}
        />
        {mode === 'adjust' && (
          <Select
            label="Direction"
            value={direction}
            onChange={(event) => setDirection(event.target.value as Direction)}
          >
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">Calculate</Button>
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
        <div className="space-y-3">
          <ResultBox label="Result" value={String(result.result.value)} copyLabel="Copy result">
            {formatPercentNumber(result.result.value)}
            {result.result.kind === 'percent' ? '%' : ''}
          </ResultBox>
          <p className="text-sm text-muted-foreground">{result.summary}.</p>
        </div>
      )}
    </form>
  );
}
