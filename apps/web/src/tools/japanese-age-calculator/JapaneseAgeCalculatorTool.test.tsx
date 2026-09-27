import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapaneseAgeCalculatorTool } from './JapaneseAgeCalculatorTool';

describe('JapaneseAgeCalculatorTool', () => {
  it('defaults the reference date to today', () => {
    render(<JapaneseAgeCalculatorTool />);
    const today = new Date().toISOString().slice(0, 10);
    expect(screen.getByLabelText('Reference date')).toHaveValue(today);
  });

  it('calculates age between a birth date and a chosen reference date', () => {
    render(<JapaneseAgeCalculatorTool />);
    fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: '1990-06-15' } });
    fireEvent.change(screen.getByLabelText('Reference date'), { target: { value: '2024-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate age' }));
    expect(screen.getByText('34 years, 0 months, 0 days')).toBeInTheDocument();
  });

  it('shows the days-until and turning-age for the next birthday', () => {
    render(<JapaneseAgeCalculatorTool />);
    fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: '1990-08-20' } });
    fireEvent.change(screen.getByLabelText('Reference date'), { target: { value: '2024-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate age' }));
    expect(screen.getByText(/2024-08-20/)).toBeInTheDocument();
    expect(screen.getByText(/turning 34/)).toBeInTheDocument();
  });

  it('announces today as the birthday when the reference date matches it', () => {
    render(<JapaneseAgeCalculatorTool />);
    fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: '1990-06-15' } });
    fireEvent.change(screen.getByLabelText('Reference date'), { target: { value: '2024-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate age' }));
    expect(screen.getByText(/Today — turning 34/)).toBeInTheDocument();
  });

  it('shows a validation error for a blank date of birth', () => {
    render(<JapaneseAgeCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Calculate age' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid date of birth/i);
  });

  it('shows a validation error for a future birth date', () => {
    render(<JapaneseAgeCalculatorTool />);
    fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: '2999-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate age' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be after/i);
  });

  it('resets both dates and the result', () => {
    render(<JapaneseAgeCalculatorTool />);
    fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: '1990-06-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate age' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByLabelText(/Date of birth/)).toHaveValue('');
    expect(screen.queryByText(/years,/)).not.toBeInTheDocument();
  });

  it('handles a leap-day birthday', () => {
    render(<JapaneseAgeCalculatorTool />);
    fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: '2000-02-29' } });
    fireEvent.change(screen.getByLabelText('Reference date'), { target: { value: '2024-02-29' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate age' }));
    expect(screen.getByText('24 years, 0 months, 0 days')).toBeInTheDocument();
  });
});
