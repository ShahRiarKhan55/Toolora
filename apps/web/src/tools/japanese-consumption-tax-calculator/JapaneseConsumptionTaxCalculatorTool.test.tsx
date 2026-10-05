import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapaneseConsumptionTaxCalculatorTool } from './JapaneseConsumptionTaxCalculatorTool';

function calculate(amount: string, opts: { rate?: string; mode?: string } = {}) {
  if (opts.rate)
    fireEvent.change(screen.getByLabelText('Tax rate'), { target: { value: opts.rate } });
  if (opts.mode)
    fireEvent.change(screen.getByLabelText('Amount is'), { target: { value: opts.mode } });
  fireEvent.change(screen.getByLabelText('Amount (JPY)'), { target: { value: amount } });
  fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
}

describe('JapaneseConsumptionTaxCalculatorTool', () => {
  it('adds 10% tax to a tax-exclusive amount by default and states the rate', () => {
    render(<JapaneseConsumptionTaxCalculatorTool />);
    calculate('1000');
    expect(screen.getByText('Calculated at 10% consumption tax.')).toBeInTheDocument();
    expect(screen.getByText('¥100')).toBeInTheDocument();
    expect(screen.getByText('¥1,100')).toBeInTheDocument();
  });

  it('splits 8% tax out of a tax-inclusive amount', () => {
    render(<JapaneseConsumptionTaxCalculatorTool />);
    calculate('1080', { rate: '8', mode: 'inclusive' });
    expect(screen.getByText('Calculated at 8% consumption tax.')).toBeInTheDocument();
    expect(screen.getByText('¥1,000')).toBeInTheDocument();
    expect(screen.getByText('¥80')).toBeInTheDocument();
  });

  it('calculates on Enter (form submit)', () => {
    render(<JapaneseConsumptionTaxCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Amount (JPY)'), { target: { value: '500' } });
    fireEvent.submit(screen.getByLabelText('Amount (JPY)').closest('form')!);
    expect(screen.getByText('¥550')).toBeInTheDocument();
  });

  it('shows an announced error for invalid and negative input, with no result', () => {
    render(<JapaneseConsumptionTaxCalculatorTool />);
    calculate('abc');
    expect(screen.getByRole('alert')).toHaveTextContent(/plain number/);
    expect(screen.queryByText(/Calculated at/)).not.toBeInTheDocument();
    calculate('-5');
    expect(screen.getByRole('alert')).toHaveTextContent(/0 or more/);
  });

  it('shows an error for empty input', () => {
    render(<JapaneseConsumptionTaxCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount in yen.');
  });

  it('resets everything', () => {
    render(<JapaneseConsumptionTaxCalculatorTool />);
    calculate('1000', { rate: '8' });
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Amount (JPY)')).toHaveValue('');
    expect(screen.getByLabelText('Tax rate')).toHaveValue('10');
    expect(screen.queryByText(/Calculated at/)).not.toBeInTheDocument();
  });

  it('states its scope and that it is not tax advice', () => {
    render(<JapaneseConsumptionTaxCalculatorTool />);
    expect(screen.getByText(/standard 8% and 10% calculations only/)).toBeInTheDocument();
    expect(screen.getByText(/not tax advice/)).toBeInTheDocument();
  });
});
