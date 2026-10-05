import { CURRENCY_CODES } from '@toolora/shared';
import type { CurrencyCode, ToolPreset } from '@toolora/shared';
import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { fetchRates, RATES_ERROR_MESSAGES, RatesError } from './api';
import type { RateTable, RatesFailure } from './api';
import {
  AMOUNT_ERROR_MESSAGES,
  buildCopyText,
  convertAmount,
  currencyLabel,
  formatAmount,
  formatRate,
  parseAmount,
  POPULAR_PAIRS,
  rateDate,
  SOURCES,
  sourceName,
} from './logic';

const DEFAULT_AMOUNT = '10000';
const DEFAULT_PAIR: ToolPreset = { from: 'JPY', to: 'BDT' };

const PRIMARY_SOURCE = SOURCES['exchangerate-api']!;

/** Credits the provider that actually supplied the shown rate; ExchangeRate-API's open endpoint requires a visible link. */
function Attribution({ source }: { source: string | undefined }) {
  if (source === undefined || source === 'exchangerate-api') {
    return (
      <p className="text-sm text-muted-foreground">
        Rates by{' '}
        <a className="text-primary underline" href={PRIMARY_SOURCE.url} rel="noopener noreferrer">
          ExchangeRate-API
        </a>
        .
      </p>
    );
  }
  const used = SOURCES[source];
  return (
    <p className="text-sm text-muted-foreground">
      Rates from{' '}
      {used ? (
        <a className="text-primary underline" href={used.url} rel="noopener noreferrer">
          {used.name}
        </a>
      ) : (
        sourceName(source)
      )}{' '}
      (backup source; our main provider is{' '}
      <a className="text-primary underline" href={PRIMARY_SOURCE.url} rel="noopener noreferrer">
        ExchangeRate-API
      </a>
      ).
    </p>
  );
}

export function CurrencyConverterTool({ preset = DEFAULT_PAIR }: { preset?: ToolPreset }) {
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [from, setFrom] = useState<CurrencyCode>(preset.from);
  const [to, setTo] = useState<CurrencyCode>(preset.to);
  // One table per base currency, kept for the life of the page: changing the target currency or
  // returning to an earlier base costs no request. Rates are daily, so there is nothing to poll.
  const [tables, setTables] = useState<Partial<Record<CurrencyCode, RateTable>>>({});
  const [failure, setFailure] = useState<{ base: CurrencyCode; kind: RatesFailure } | null>(null);

  useEffect(() => {
    if (tables[from] || failure?.base === from) return;
    const controller = new AbortController();
    fetchRates(from, controller.signal).then(
      (table) => setTables((previous) => ({ ...previous, [from]: table })),
      (err: unknown) => {
        if (controller.signal.aborted) return;
        setFailure({ base: from, kind: err instanceof RatesError ? err.kind : 'unavailable' });
      },
    );
    return () => controller.abort();
  }, [from, tables, failure]);

  const table = tables[from];
  const rate = table?.rates[to];
  const failedKind = failure?.base === from ? failure.kind : null;
  const parsed = parseAmount(amount);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const quote =
    table && rate !== undefined && parsed.ok
      ? { amount: parsed.value, from, to, rate, updatedAt: table.updatedAt, source: table.source }
      : null;

  return (
    <div className="space-y-6">
      <Input
        label="Amount"
        inputMode="decimal"
        autoComplete="off"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        error={parsed.ok ? undefined : AMOUNT_ERROR_MESSAGES[parsed.error]}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Select
          label="From"
          value={from}
          onChange={(event) => setFrom(event.target.value as CurrencyCode)}
        >
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {currencyLabel(code)}
            </option>
          ))}
        </Select>
        <Button
          variant="secondary"
          className="w-full sm:w-11 sm:px-0"
          aria-label="Swap currencies"
          onClick={swap}
        >
          <span aria-hidden="true" className="text-lg">
            ⇄
          </span>
          <span className="sm:sr-only">Swap</span>
        </Button>
        <Select
          label="To"
          value={to}
          onChange={(event) => setTo(event.target.value as CurrencyCode)}
        >
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {currencyLabel(code)}
            </option>
          ))}
        </Select>
      </div>

      <section aria-label="Popular pairs">
        <p className="text-sm font-semibold">Popular pairs</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {POPULAR_PAIRS.map((pair) => {
            const active = pair.from === from && pair.to === to;
            return (
              <li key={`${pair.from}-${pair.to}`}>
                <Button
                  size="sm"
                  variant={active ? 'primary' : 'secondary'}
                  aria-pressed={active}
                  onClick={() => {
                    setFrom(pair.from);
                    setTo(pair.to);
                  }}
                >
                  {pair.from} → {pair.to}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      {failedKind ? (
        <Alert tone="error" title="Could not load exchange rates">
          <p>{RATES_ERROR_MESSAGES[failedKind]}</p>
          <Button className="mt-3" variant="secondary" size="sm" onClick={() => setFailure(null)}>
            Try again
          </Button>
        </Alert>
      ) : !table ? (
        <p role="status" className="text-muted-foreground">
          Loading the daily reference rate…
        </p>
      ) : rate === undefined ? (
        <Alert tone="error" title="Could not load exchange rates">
          {RATES_ERROR_MESSAGES.malformed}
        </Alert>
      ) : (
        quote && (
          <div className="space-y-4">
            <ResultBox
              label="Converted amount (approximate)"
              value={buildCopyText(quote)}
              copyLabel="Copy result"
            >
              <span className="block text-base font-semibold text-muted-foreground">
                {formatAmount(quote.amount, from)} ≈
              </span>
              <span>{formatAmount(convertAmount(quote.amount, rate), to)}</span>
            </ResultBox>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="font-semibold">Daily reference rate</dt>
              <dd>{formatRate(from, to, rate)}</dd>
              <dt className="font-semibold">Rate date</dt>
              <dd>{rateDate(table.updatedAt)} (UTC)</dd>
              <dt className="font-semibold">Source</dt>
              <dd>{sourceName(table.source)}</dd>
              <dt className="font-semibold">Delivery</dt>
              <dd>
                {table.cached
                  ? 'Served from Toolora’s short-term cache; the rate date above is unchanged.'
                  : 'Just retrieved from the provider.'}
              </dd>
            </dl>
          </div>
        )
      )}

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          These are daily reference rates, published about once a day, not live or real-time rates.
          Banks, cards and money-transfer services use their own rates and fees, so the amount you
          actually receive will differ. For information only, not financial advice.
        </p>
        <p className="text-sm text-muted-foreground">
          Your amount stays in your browser. Only the currency code is sent to Toolora to look up
          the rate.
        </p>
        <Attribution source={table?.source} />
      </div>
    </div>
  );
}
