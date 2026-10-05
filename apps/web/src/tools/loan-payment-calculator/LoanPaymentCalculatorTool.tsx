import { useState } from 'react';
import { CurrencySelect } from '../../components/tool/CurrencySelect';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { formatMoney } from '../../lib/formatMoney';
import { FREQUENCY_OPTIONS, LOAN_ERROR_MESSAGES, calculateLoan } from './logic';
import type { FrequencyId, LoanResult, TermUnit } from './logic';

export function LoanPaymentCalculatorTool() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [term, setTerm] = useState('');
  const [termUnit, setTermUnit] = useState<TermUnit>('years');
  const [frequency, setFrequency] = useState<FrequencyId>('monthly');
  const [currency, setCurrency] = useState('');
  const [result, setResult] = useState<LoanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function calculate() {
    const outcome = calculateLoan({ amount, ratePercent: rate, term, termUnit, frequency });
    if (!outcome.ok) {
      setResult(null);
      setError(LOAN_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function reset() {
    setAmount('');
    setRate('');
    setTerm('');
    setTermUnit('years');
    setFrequency('monthly');
    setResult(null);
    setError(null);
  }

  const money = (value: number) => formatMoney(value, currency);
  const frequencyLabel = FREQUENCY_OPTIONS.find((o) => o.id === frequency)!.label.split(' ')[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Loan amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="200000"
        />
        <Input
          label="Annual interest rate (%)"
          inputMode="decimal"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          placeholder="6"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Loan term"
            inputMode="decimal"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="30"
          />
          <Select
            label="Unit"
            value={termUnit}
            onChange={(event) => setTermUnit(event.target.value as TermUnit)}
          >
            <option value="years">Years</option>
            <option value="months">Months</option>
          </Select>
        </div>
        <Select
          label="Payment frequency"
          value={frequency}
          onChange={(event) => setFrequency(event.target.value as FrequencyId)}
        >
          {FREQUENCY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
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
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <ResultBox
              label={`${frequencyLabel} payment`}
              value={money(result.payment)}
              copyLabel="Copy payment"
            />
            <ResultBox
              label={`Total of ${result.paymentCount.toLocaleString('en-US')} payments`}
              value={money(result.totalPaid)}
              copyLabel="Copy total payments"
            />
            <ResultBox
              label="Total interest"
              value={money(result.totalInterest)}
              copyLabel="Copy total interest"
            />
          </div>

          <details className="rounded-control border border-border p-4">
            <summary className="min-h-6 cursor-pointer font-semibold">
              Yearly amortization summary
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-96 text-left text-sm">
                <caption className="sr-only">
                  Interest, principal and remaining balance by year
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Year
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">
                      Interest
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">
                      Principal
                    </th>
                    <th scope="col" className="py-2 text-right font-semibold">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.years.map((row) => (
                    <tr key={row.year} className="border-b border-border last:border-0">
                      <th scope="row" className="py-2 pr-3 font-normal">
                        {row.year}
                      </th>
                      <td className="py-2 pr-3 text-right">{money(row.interest)}</td>
                      <td className="py-2 pr-3 text-right">{money(row.principal)}</td>
                      <td className="py-2 text-right">{money(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
