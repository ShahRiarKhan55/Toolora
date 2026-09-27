import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { CURRENCY_OPTIONS, convertYen, YEN_CONVERTER_ERROR_MESSAGES } from './logic';

const DEFAULT_AMOUNT = '10000';
const DEFAULT_CURRENCY = CURRENCY_OPTIONS[0]!.code;

function defaultRates(): Record<string, string> {
  return Object.fromEntries(
    CURRENCY_OPTIONS.map((option) => [option.code, String(option.defaultRate)]),
  );
}

const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export function JapaneseYenConverterTool() {
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<string, string>>(defaultRates);
  const [result, setResult] = useState<{ converted: number; code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currency =
    CURRENCY_OPTIONS.find((option) => option.code === currencyCode) ?? CURRENCY_OPTIONS[0]!;
  const rateValue = rates[currencyCode] ?? String(currency.defaultRate);

  function handleConvert() {
    const outcome = convertYen(amount, rateValue);
    if (!outcome.ok) {
      setResult(null);
      setError(YEN_CONVERTER_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult({ converted: outcome.value.converted, code: currency.code });
  }

  function handleReset() {
    setAmount(DEFAULT_AMOUNT);
    setCurrencyCode(DEFAULT_CURRENCY);
    setRates(defaultRates());
    setResult(null);
    setError(null);
  }

  const formattedResult = result
    ? `${numberFormatter.format(result.converted)} ${result.code}`
    : '';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Amount in yen"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          hint="The amount in Japanese yen (¥) you want to convert."
        />
        <Select
          label="Convert to"
          value={currencyCode}
          onChange={(event) => setCurrencyCode(event.target.value)}
        >
          {CURRENCY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name} ({option.code})
            </option>
          ))}
        </Select>
      </div>

      <Input
        label={`Reference rate (${currency.code} per ¥1)`}
        inputMode="decimal"
        value={rateValue}
        onChange={(event) =>
          setRates((previous) => ({ ...previous, [currencyCode]: event.target.value }))
        }
        hint="Not a live market rate. Edit it to match a rate you trust, then convert again."
      />

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleConvert}>Convert</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not convert">
          {error}
        </Alert>
      )}

      {result && !error && <ResultBox label="Converted amount" value={formattedResult} />}
    </div>
  );
}
