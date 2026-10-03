import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateDifferenceCalculatorTool } from './DateDifferenceCalculatorTool';

function calculate(start: string, end: string) {
  fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: start } });
  fireEvent.change(screen.getByLabelText(/End date/), { target: { value: end } });
  fireEvent.click(screen.getByRole('button', { name: 'Calculate difference' }));
}

describe('DateDifferenceCalculatorTool', () => {
  it('shows total days, weeks and the calendar breakdown', () => {
    render(<DateDifferenceCalculatorTool />);
    calculate('2024-01-01', '2025-01-01');
    expect(screen.getByText('366 days')).toBeInTheDocument();
    expect(screen.getByText('52 weeks and 2 days')).toBeInTheDocument();
    expect(screen.getByText('1 year, 0 months, 0 days')).toBeInTheDocument();
  });

  it('handles the same day', () => {
    render(<DateDifferenceCalculatorTool />);
    calculate('2026-05-05', '2026-05-05');
    expect(screen.getByText('0 days')).toBeInTheDocument();
  });

  it('explains when the dates were reversed', () => {
    render(<DateDifferenceCalculatorTool />);
    calculate('2026-01-10', '2026-01-01');
    expect(screen.getByText(/end date is before the start date/i)).toBeInTheDocument();
    expect(screen.getByText('9 days')).toBeInTheDocument();
  });

  it('announces a missing date', () => {
    render(<DateDifferenceCalculatorTool />);
    calculate('', '2026-01-01');
    expect(screen.getByRole('alert')).toHaveTextContent(/start date/i);
  });

  it('resets both dates and the result', () => {
    render(<DateDifferenceCalculatorTool />);
    calculate('2026-01-01', '2026-01-02');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText(/Start date/)).toHaveValue('');
    expect(screen.getByLabelText(/End date/)).toHaveValue('');
    expect(screen.queryByText('1 day')).not.toBeInTheDocument();
  });
});
