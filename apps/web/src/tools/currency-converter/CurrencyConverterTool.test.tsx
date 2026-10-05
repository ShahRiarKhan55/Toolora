import type { ToolPreset } from '@toolora/shared';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrencyConverterTool } from './CurrencyConverterTool';
import { TOOL_VARIANT_CONTENT } from '..';

const RATES = {
  JPY: { JPY: 1, BDT: 0.8, USD: 0.0067, EUR: 0.0062 },
  BDT: { JPY: 1.25, BDT: 1, USD: 0.0083 },
} as const;

function ok(base: keyof typeof RATES, extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      base,
      rates: RATES[base],
      updatedAt: '2026-10-05T00:02:31.000Z',
      source: 'exchangerate-api',
      cached: false,
      ...extra,
    }),
    { status: 200 },
  );
}

function stubFetch(handler: (base: string) => Response | Promise<Response>) {
  const mock = vi.fn((input: string) => {
    const base = new URL(input, 'http://localhost').searchParams.get('base') ?? '';
    return Promise.resolve(handler(base));
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function renderTool(preset?: ToolPreset) {
  return render(
    <MemoryRouter>
      <CurrencyConverterTool preset={preset} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  stubFetch((base) => ok(base as keyof typeof RATES));
});
afterEach(() => vi.unstubAllGlobals());

describe('CurrencyConverterTool', () => {
  it('starts as JPY → BDT and shows the converted result with rate, date and source', async () => {
    renderTool();
    expect(screen.getByLabelText('From')).toHaveValue('JPY');
    expect(screen.getByLabelText('To')).toHaveValue('BDT');
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);

    expect(await screen.findByText('8,000.00 BDT')).toBeInTheDocument();
    expect(screen.getByText('10,000 JPY ≈')).toBeInTheDocument();
    expect(screen.getByText('1 JPY = 0.8 BDT')).toBeInTheDocument();
    expect(screen.getByText('2026-10-05 (UTC)')).toBeInTheDocument();
    expect(screen.getByText('ExchangeRate-API', { selector: 'dd' })).toBeInTheDocument();
  });

  it('never calls a provider directly and requests only Toolora’s API', async () => {
    const mock = stubFetch((base) => ok(base as keyof typeof RATES));
    renderTool();
    await screen.findByText('8,000.00 BDT');
    const urls = mock.mock.calls.map((call) => call[0]);
    expect(urls).toEqual(['/api/currency/rates?base=JPY']);
  });

  it('recomputes locally when the amount changes, without another request', async () => {
    const mock = stubFetch((base) => ok(base as keyof typeof RATES));
    renderTool();
    await screen.findByText('8,000.00 BDT');
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100,000' } });
    expect(screen.getByText('80,000.00 BDT')).toBeInTheDocument();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('changes the target currency without another request', async () => {
    const mock = stubFetch((base) => ok(base as keyof typeof RATES));
    renderTool();
    await screen.findByText('8,000.00 BDT');
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'USD' } });
    expect(screen.getByText('67.00 USD')).toBeInTheDocument();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('swaps the currencies and keeps the amount', async () => {
    renderTool();
    await screen.findByText('8,000.00 BDT');
    fireEvent.click(screen.getByRole('button', { name: 'Swap currencies' }));
    expect(screen.getByLabelText('From')).toHaveValue('BDT');
    expect(screen.getByLabelText('To')).toHaveValue('JPY');
    expect(screen.getByLabelText('Amount')).toHaveValue('10000');
    expect(await screen.findByText('12,500 JPY')).toBeInTheDocument();
  });

  it('applies a popular pair and marks it pressed', async () => {
    renderTool();
    await screen.findByText('8,000.00 BDT');
    const pairs = within(screen.getByRole('region', { name: 'Popular pairs' }));
    fireEvent.click(pairs.getByRole('button', { name: 'JPY → EUR' }));
    expect(screen.getByLabelText('To')).toHaveValue('EUR');
    expect(pairs.getByRole('button', { name: 'JPY → EUR' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(pairs.getByRole('button', { name: 'JPY → BDT' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(await screen.findByText('62.00 EUR')).toBeInTheDocument();
  });

  it('starts from a preset', async () => {
    renderTool({ from: 'BDT', to: 'JPY' });
    expect(screen.getByLabelText('From')).toHaveValue('BDT');
    expect(await screen.findByText('12,500 JPY')).toBeInTheDocument();
  });

  it('shows a field error for invalid amounts and no result', async () => {
    renderTool();
    await screen.findByText('8,000.00 BDT');
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: 'abc' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/valid number/i);
    expect(screen.queryByText(/^[d,.]+ BDT$/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '-5' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be negative/i);
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/enter an amount/i);
  });

  it('copies a summary built from the real returned values', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderTool();
    await screen.findByText('8,000.00 BDT');
    fireEvent.click(screen.getByRole('button', { name: 'Copy result' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText).toHaveBeenCalledWith(
      [
        '10,000 JPY = 8,000.00 BDT',
        'Rate: 1 JPY = 0.8 BDT',
        'Daily reference rate: 2026-10-05',
        'Source: ExchangeRate-API',
      ].join('\n'),
    );
    await waitFor(() => expect(screen.getByText('Copied to clipboard.')).toBeInTheDocument());
  });

  it('credits the fallback provider truthfully when it supplied the rate', async () => {
    stubFetch((base) => ok(base as keyof typeof RATES, { source: 'fawazahmed0', cached: true }));
    renderTool();
    await screen.findByText('8,000.00 BDT');
    expect(screen.getByText('fawazahmed0 currency-api', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText(/short-term cache/)).toBeInTheDocument();
    expect(screen.queryByText(/^Rates by/)).not.toBeInTheDocument();
    expect(screen.getByText(/backup source/)).toBeInTheDocument();
  });

  it('always links ExchangeRate-API attribution while loading and on the primary source', async () => {
    renderTool();
    const link = screen.getByRole('link', { name: 'ExchangeRate-API' });
    expect(link).toHaveAttribute('href', 'https://www.exchangerate-api.com');
    await screen.findByText('8,000.00 BDT');
    expect(screen.getByRole('link', { name: 'ExchangeRate-API' })).toHaveAttribute(
      'href',
      'https://www.exchangerate-api.com',
    );
  });

  it('never calls the data live or real-time', async () => {
    renderTool();
    await screen.findByText('8,000.00 BDT');
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/not live or real-time/);
    expect(text).toMatch(/not financial advice/);
  });

  describe('failures', () => {
    it.each([
      [503, /temporarily unavailable/i],
      [429, /too many requests/i],
      [504, /took too long/i],
    ])('shows a friendly message for HTTP %i, never the server text', async (status, message) => {
      stubFetch(
        () => new Response(JSON.stringify({ error: { message: 'SECRET internals' } }), { status }),
      );
      renderTool();
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(message);
      expect(document.body.textContent).not.toContain('SECRET');
      expect(screen.queryByText(/^[d,.]+ BDT$/)).not.toBeInTheDocument();
    });

    it('handles a malformed response', async () => {
      stubFetch(() => new Response('{"nope":true}', { status: 200 }));
      renderTool();
      expect(await screen.findByRole('alert')).toHaveTextContent(/could not read/i);
    });

    it('handles a network failure', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
      );
      renderTool();
      expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/i);
    });

    it('handles a missing target rate as a malformed response', async () => {
      stubFetch(() => ok('JPY', { rates: { JPY: 1 } }));
      renderTool();
      expect(await screen.findByRole('alert')).toHaveTextContent(/could not read/i);
    });

    it('retries only on request and recovers', async () => {
      let calls = 0;
      const mock = stubFetch((base) =>
        ++calls === 1 ? new Response('{}', { status: 502 }) : ok(base as keyof typeof RATES),
      );
      renderTool();
      await screen.findByRole('alert');
      expect(mock).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(await screen.findByText('8,000.00 BDT')).toBeInTheDocument();
      expect(mock).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    });

    it('does not retry automatically or poll', async () => {
      vi.useFakeTimers();
      try {
        const mock = stubFetch(() => new Response('{}', { status: 502 }));
        renderTool();
        await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
        expect(mock).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});

describe('variant copy', () => {
  it('states no fixed rate and links to the general converter', () => {
    for (const [slug, content] of Object.entries(TOOL_VARIANT_CONTENT)) {
      const { container } = render(
        <MemoryRouter>
          <div>{content.about}</div>
        </MemoryRouter>,
      );
      expect(container.querySelector('a[href="/tools/currency-converter"]'), slug).not.toBeNull();
      expect(container.textContent).toMatch(/illustrative/);
    }
  });
});
