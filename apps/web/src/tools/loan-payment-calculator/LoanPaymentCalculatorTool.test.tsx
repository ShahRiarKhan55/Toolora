import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoanPaymentCalculatorTool } from './LoanPaymentCalculatorTool';

function fill(amount: string, rate: string, term: string) {
  fireEvent.change(screen.getByLabelText('Loan amount'), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText('Annual interest rate (%)'), { target: { value: rate } });
  fireEvent.change(screen.getByLabelText('Loan term'), { target: { value: term } });
}

const calculate = () => fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));

describe('LoanPaymentCalculatorTool', () => {
  it('shows the payment, total paid and total interest', () => {
    render(<LoanPaymentCalculatorTool />);
    fill('200000', '6', '30');
    calculate();
    expect(screen.getByText('Monthly payment')).toBeInTheDocument();
    expect(screen.getByText('1,199.10')).toBeInTheDocument();
    expect(screen.getByText('Total of 360 payments')).toBeInTheDocument();
    expect(screen.getByText('431,676.38')).toBeInTheDocument();
    expect(screen.getByText('231,676.38')).toBeInTheDocument();
  });

  it('handles a zero-interest loan', () => {
    render(<LoanPaymentCalculatorTool />);
    fill('12000', '0', '2');
    calculate();
    expect(screen.getByText('500.00')).toBeInTheDocument();
    expect(screen.getByText('12,000.00')).toBeInTheDocument();
    expect(screen.getAllByText('0.00').length).toBeGreaterThan(0);
  });

  it('supports biweekly and weekly payments', () => {
    render(<LoanPaymentCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Payment frequency'), { target: { value: 'biweekly' } });
    fill('12000', '0', '1');
    calculate();
    expect(screen.getByText('Biweekly payment')).toBeInTheDocument();
    expect(screen.getByText('Total of 26 payments')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Payment frequency'), { target: { value: 'weekly' } });
    calculate();
    expect(screen.getByText('Weekly payment')).toBeInTheDocument();
    expect(screen.getByText('Total of 52 payments')).toBeInTheDocument();
  });

  it('shows a yearly amortization table that ends at a zero balance', () => {
    render(<LoanPaymentCalculatorTool />);
    fill('12000', '12', '2');
    calculate();
    const table = screen.getByRole('table', { name: /Interest, principal and remaining balance/ });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3); // header + 2 years
    expect(within(rows[2]!).getAllByRole('cell').at(-1)).toHaveTextContent('0.00');
  });

  it('labels amounts with a currency when chosen', () => {
    render(<LoanPaymentCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Currency label'), { target: { value: 'JPY' } });
    fill('120000', '0', '1');
    calculate();
    expect(screen.getAllByText('¥10,000').length).toBeGreaterThan(0);
  });

  it.each([
    ['', '5', '10', /loan amount greater than 0/i],
    ['1000', '-1', '10', /interest rate/i],
    ['1000', '5', '', /loan term greater than 0/i],
    ['1000', '5', '0.01', /shorter than one payment period/i],
  ])('rejects invalid input (%j, %j, %j)', (amount, rate, term, message) => {
    render(<LoanPaymentCalculatorTool />);
    fill(amount, rate, term);
    calculate();
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByText(/Total interest/)).not.toBeInTheDocument();
  });

  it('offers copy buttons and resets', () => {
    render(<LoanPaymentCalculatorTool />);
    fill('1000', '5', '1');
    calculate();
    expect(screen.getByRole('button', { name: 'Copy payment' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Loan amount')).toHaveValue('');
    expect(screen.queryByText(/Total interest/)).not.toBeInTheDocument();
  });
});
