import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapanesePhoneNumberFormatterTool } from './JapanesePhoneNumberFormatterTool';

function format(value: string) {
  fireEvent.change(screen.getByLabelText('Phone number'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Format' }));
}

describe('JapanesePhoneNumberFormatterTool', () => {
  it('shows domestic and international formats', () => {
    render(<JapanesePhoneNumberFormatterTool />);
    format('09012345678');
    expect(screen.getByText('090-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('+81-90-1234-5678')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy domestic format' })).toBeInTheDocument();
  });

  it('says the number is not verified', () => {
    render(<JapanesePhoneNumberFormatterTool />);
    expect(screen.getByText(/not checked against any real number/i)).toBeInTheDocument();
  });

  it('keeps the digits and warns instead of guessing an unknown pattern', () => {
    render(<JapanesePhoneNumberFormatterTool />);
    format('0422123456');
    expect(screen.getByText('0422123456')).toBeInTheDocument();
    expect(screen.getByText(/not hyphenated rather than guessed/i)).toBeInTheDocument();
    expect(screen.queryByText('International format')).not.toBeInTheDocument();
  });

  it('announces invalid input', () => {
    render(<JapanesePhoneNumberFormatterTool />);
    format('090-ABCD-5678');
    expect(screen.getByRole('alert')).toHaveTextContent(/digits only/i);
    expect(screen.getByLabelText('Phone number')).toBeInvalid();
  });

  it('announces empty input', () => {
    render(<JapanesePhoneNumberFormatterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a phone number/i);
  });

  it('resets', () => {
    render(<JapanesePhoneNumberFormatterTool />);
    format('0312345678');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Phone number')).toHaveValue('');
    expect(screen.queryByText('03-1234-5678')).not.toBeInTheDocument();
  });
});
