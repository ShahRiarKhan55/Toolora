import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { ROUNDING_OPTIONS, TAX_ERROR_MESSAGES, calculateTax, formatYen } from './logic';
import type { Rounding, TaxMode, TaxRate, TaxResult } from './logic';

export function JapaneseConsumptionTaxCalculatorTool() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState<TaxRate>(10);
  const [mode, setMode] = useState<TaxMode>('exclusive');
  const [rounding, setRounding] = useState<Rounding>('floor');
  const [result, setResult] = useState<TaxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function calculate() {
    const outcome = calculateTax({ amount, rate, mode, rounding });
    if (!outcome.ok) {
      setResult(null);
      setError(TAX_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function reset() {
    setAmount('');
    setRate(10);
    setMode('exclusive');
    setRounding('floor');
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
          label="Amount is"
          value={mode}
          onChange={(event) => setMode(event.target.value as TaxMode)}
        >
          <option value="exclusive">Tax-exclusive (税抜): add tax</option>
          <option value="inclusive">Tax-inclusive (税込): split out tax</option>
        </Select>
        <Select
          label="Tax rate"
          value={String(rate)}
          onChange={(event) => setRate(Number(event.target.value) as TaxRate)}
          hint="10% standard rate; 8% reduced rate (certain food and drink, newspapers)."
        >
          <option value="10">10% (standard)</option>
          <option value="8">8% (reduced)</option>
        </Select>
        <Input
          label="Amount (JPY)"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="1000"
        />
        <Select
          label="Rounding of the tax"
          value={rounding}
          onChange={(event) => setRounding(event.target.value as Rounding)}
          hint="Shops choose their own rounding; check the receipt if cents matter."
        >
          {ROUNDING_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
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
        <div className="space-y-4">
          <p className="text-sm font-semibold">Calculated at {result.rate}% consumption tax.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <ResultBox
              label="Pre-tax amount (税抜)"
              value={formatYen(result.preTax)}
              copyLabel="Copy pre-tax amount"
            />
            <ResultBox
              label={`Consumption tax (${result.rate}%)`}
              value={formatYen(result.tax)}
              copyLabel="Copy tax"
            />
            <ResultBox
              label="Tax-inclusive amount (税込)"
              value={formatYen(result.total)}
              copyLabel="Copy tax-inclusive amount"
            />
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Covers the standard 8% and 10% calculations only. It does not handle exemptions, special
        cases, the qualified-invoice system or business accounting, and it is not tax advice.
      </p>
    </form>
  );
}
