import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompoundInterestCalculatorTool } from './CompoundInterestCalculatorTool';

function fill(principal: string, rate: string, time: string) {
  fireEvent.change(screen.getByLabelText('Principal (starting amount)'), {
    target: { value: principal },
  });
  fireEvent.change(screen.getByLabelText('Annual interest rate (%)'), { target: { value: rate } });
  fireEvent.change(screen.getByLabelText('Time period'), { target: { value: time } });
}

const calculate = () => fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

describe('CompoundInterestCalculatorTool', () => {
  it('shows final amount, interest and principal', () => {
    render(<CompoundInterestCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Compounding'), { target: { value: 'yearly' } });
    fill('1000', '5', '10');
    calculate();
    expect(screen.getByText('1,628.89')).toBeInTheDocument();
    expect(screen.getByText('628.89')).toBeInTheDocument();
    expect(screen.getByText('1,000.00')).toBeInTheDocument();
  });

  it('labels amounts with the chosen currency without converting them', () => {
    render(<CompoundInterestCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Compounding'), { target: { value: 'yearly' } });
    fireEvent.change(screen.getByLabelText('Currency label'), { target: { value: 'USD' } });
    fill('1000', '5', '10');
    calculate();
    expect(screen.getByText('$1,628.89')).toBeInTheDocument();
  });

  it('formats JPY without decimals', () => {
    render(<CompoundInterestCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Compounding'), { target: { value: 'yearly' } });
    fireEvent.change(screen.getByLabelText('Currency label'), { target: { value: 'JPY' } });
    fill('100000', '0', '1');
    calculate();
    expect(screen.getAllByText('¥100,000')).toHaveLength(2);
  });

  it('accepts months as the time unit', () => {
    render(<CompoundInterestCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Compounding'), { target: { value: 'yearly' } });
    fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'months' } });
    fill('1000', '5', '12');
    calculate();
    expect(screen.getByText('1,050.00')).toBeInTheDocument();
  });

  it('shows a validation error for bad input and no result', () => {
    render(<CompoundInterestCalculatorTool />);
    fill('', '5', '10');
    calculate();
    expect(screen.getByRole('alert')).toHaveTextContent(/principal greater than 0/i);
    expect(screen.queryByText('Final amount')).not.toBeInTheDocument();
  });

  it('rejects a negative rate and a zero period', () => {
    render(<CompoundInterestCalculatorTool />);
    fill('1000', '-1', '10');
    calculate();
    expect(screen.getByRole('alert')).toHaveTextContent(/annual rate/i);
    fill('1000', '5', '0');
    calculate();
    expect(screen.getByRole('alert')).toHaveTextContent(/time period/i);
  });

  it('offers copy buttons for each result and resets everything', () => {
    render(<CompoundInterestCalculatorTool />);
    fill('1000', '5', '10');
    calculate();
    expect(screen.getByRole('button', { name: 'Copy final amount' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy total interest' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Principal (starting amount)')).toHaveValue('');
    expect(screen.queryByText('Final amount')).not.toBeInTheDocument();
  });

  it('lists every compounding frequency', () => {
    render(<CompoundInterestCalculatorTool />);
    const select = screen.getByLabelText('Compounding');
    expect(Array.from((select as HTMLSelectElement).options).map((o) => o.text)).toEqual([
      'Yearly',
      'Half-yearly',
      'Quarterly',
      'Monthly',
      'Daily (365 a year)',
    ]);
  });
});
