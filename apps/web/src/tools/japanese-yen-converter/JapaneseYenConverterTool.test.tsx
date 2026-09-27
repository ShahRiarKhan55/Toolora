import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapaneseYenConverterTool } from './JapaneseYenConverterTool';

describe('JapaneseYenConverterTool', () => {
  it('converts the default amount at the default rate', () => {
    render(<JapaneseYenConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByText('67 USD')).toBeInTheDocument();
  });

  it('converts a user-entered amount and currency', () => {
    render(<JapaneseYenConverterTool />);
    fireEvent.change(screen.getByLabelText('Amount in yen'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Convert to'), { target: { value: 'EUR' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByText('6.2 EUR')).toBeInTheDocument();
  });

  it('uses an edited reference rate instead of the default', () => {
    render(<JapaneseYenConverterTool />);
    fireEvent.change(screen.getByLabelText(/Reference rate/), { target: { value: '0.01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByText('100 USD')).toBeInTheDocument();
  });

  it('shows a validation error for a non-numeric amount and no result', () => {
    render(<JapaneseYenConverterTool />);
    fireEvent.change(screen.getByLabelText('Amount in yen'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid amount/i);
    expect(screen.queryByText(/USD$/)).not.toBeInTheDocument();
  });

  it('shows a validation error for a negative amount', () => {
    render(<JapaneseYenConverterTool />);
    fireEvent.change(screen.getByLabelText('Amount in yen'), { target: { value: '-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be negative/i);
  });

  it('resets the amount, currency, rate and result', () => {
    render(<JapaneseYenConverterTool />);
    fireEvent.change(screen.getByLabelText('Amount in yen'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Convert to'), { target: { value: 'EUR' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByLabelText('Amount in yen')).toHaveValue('10000');
    expect(screen.getByLabelText('Convert to')).toHaveValue('USD');
    expect(screen.queryByText(/EUR$/)).not.toBeInTheDocument();
  });

  it('offers to copy the result once converted', () => {
    render(<JapaneseYenConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
  });

  it('states the rate is not a live market rate', () => {
    render(<JapaneseYenConverterTool />);
    expect(screen.getByText(/not a live market rate/i)).toBeInTheDocument();
  });
});
