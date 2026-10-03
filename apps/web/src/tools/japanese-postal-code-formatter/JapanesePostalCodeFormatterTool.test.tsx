import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapanesePostalCodeFormatterTool } from './JapanesePostalCodeFormatterTool';

function format(value: string) {
  fireEvent.change(screen.getByLabelText('Postal code'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Format' }));
}

describe('JapanesePostalCodeFormatterTool', () => {
  it('formats seven digits and offers to copy', () => {
    render(<JapanesePostalCodeFormatterTool />);
    format('1000001');
    expect(screen.getByText('100-0001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy postal code' })).toBeInTheDocument();
  });

  it('says that only the format is checked', () => {
    render(<JapanesePostalCodeFormatterTool />);
    expect(screen.getByText(/not whether the code exists/i)).toBeInTheDocument();
  });

  it('announces too few digits next to the field', () => {
    render(<JapanesePostalCodeFormatterTool />);
    format('100-000');
    expect(screen.getByRole('alert')).toHaveTextContent(/7 digits/);
    expect(screen.getByLabelText('Postal code')).toBeInvalid();
    expect(screen.queryByText('Formatted postal code')).not.toBeInTheDocument();
  });

  it('announces letters', () => {
    render(<JapanesePostalCodeFormatterTool />);
    format('100-000A');
    expect(screen.getByRole('alert')).toHaveTextContent(/digits only/i);
  });

  it('announces empty input', () => {
    render(<JapanesePostalCodeFormatterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a postal code/i);
  });

  it('formats on Enter (form submit) and resets', () => {
    render(<JapanesePostalCodeFormatterTool />);
    fireEvent.change(screen.getByLabelText('Postal code'), { target: { value: '〒100 0001' } });
    fireEvent.submit(screen.getByLabelText('Postal code'));
    expect(screen.getByText('100-0001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Postal code')).toHaveValue('');
    expect(screen.queryByText('100-0001')).not.toBeInTheDocument();
  });
});
