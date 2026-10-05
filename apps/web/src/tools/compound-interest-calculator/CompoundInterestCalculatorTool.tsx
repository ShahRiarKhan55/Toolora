import { useState } from 'react';
import { CurrencySelect } from '../../components/tool/CurrencySelect';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { formatMoney } from '../../lib/formatMoney';
import {
  COMPOUNDING_OPTIONS,
  COMPOUND_INTEREST_ERROR_MESSAGES,
  calculateCompoundInterest,
} from './logic';
import type { CompoundInterestResult, CompoundingId, TimeUnit } from './logic';

export function CompoundInterestCalculatorTool() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [compounding, setCompounding] = useState<CompoundingId>('monthly');
  const [time, setTime] = useState('');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('years');
  const [currency, setCurrency] = useState('');
  const [result, setResult] = useState<CompoundInterestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function calculate() {
    const outcome = calculateCompoundInterest({
      principal,
      ratePercent: rate,
      compounding,
      time,
      timeUnit,
    });
    if (!outcome.ok) {
      setResult(null);
      setError(COMPOUND_INTEREST_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function reset() {
    setPrincipal('');
    setRate('');
    setTime('');
    setCompounding('monthly');
    setTimeUnit('years');
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Principal (starting amount)"
          inputMode="decimal"
          value={principal}
          onChange={(event) => setPrincipal(event.target.value)}
          placeholder="10000"
        />
        <Input
          label="Annual interest rate (%)"
          inputMode="decimal"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          placeholder="5"
        />
        <Select
          label="Compounding"
          value={compounding}
          onChange={(event) => setCompounding(event.target.value as CompoundingId)}
        >
          {COMPOUNDING_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Time period"
            inputMode="decimal"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            placeholder="10"
          />
          <Select
            label="Unit"
            value={timeUnit}
            onChange={(event) => setTimeUnit(event.target.value as TimeUnit)}
          >
            <option value="years">Years</option>
            <option value="months">Months</option>
          </Select>
        </div>
      </div>

      <CurrencySelect value={currency} onChange={setCurrency} />

      <div className="flex flex-wrap gap-3">
        <Button onClick={calculate}>Calculate</Button>
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
        <div className="grid gap-4 sm:grid-cols-3">
          <ResultBox
            label="Final amount"
            value={formatMoney(result.finalAmount, currency)}
            copyLabel="Copy final amount"
          />
          <ResultBox
            label="Total interest"
            value={formatMoney(result.totalInterest, currency)}
            copyLabel="Copy total interest"
          />
          <ResultBox
            label="Principal"
            value={formatMoney(result.principal, currency)}
            copyLabel="Copy principal"
          />
        </div>
      )}
    </div>
  );
}
