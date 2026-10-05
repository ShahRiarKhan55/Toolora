import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BusinessDaysCalculatorTool } from './BusinessDaysCalculatorTool';

function count(start: string, end: string) {
  fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: start } });
  fireEvent.change(screen.getByLabelText(/End date/), { target: { value: end } });
  fireEvent.click(screen.getByRole('button', { name: 'Count business days' }));
}

describe('BusinessDaysCalculatorTool', () => {
  it('always states the weekend/holiday rule', () => {
    render(<BusinessDaysCalculatorTool />);
    expect(
      screen.getByText('Weekends are excluded; public holidays are not included.'),
    ).toBeInTheDocument();
  });

  it('counts a weekday range and shows calendar and weekend days', () => {
    render(<BusinessDaysCalculatorTool />);
    count('2024-03-04', '2024-03-10');
    expect(screen.getByText('5 business days')).toBeInTheDocument();
    expect(screen.getByText('Total calendar days counted: 7')).toBeInTheDocument();
    expect(screen.getByText('Weekend days excluded: 2')).toBeInTheDocument();
  });

  it('honours the include checkboxes', () => {
    render(<BusinessDaysCalculatorTool />);
    fireEvent.click(screen.getByLabelText('Include the end date'));
    count('2024-03-04', '2024-03-08');
    expect(screen.getByText('4 business days')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Include the start date'));
    fireEvent.click(screen.getByRole('button', { name: 'Count business days' }));
    expect(screen.getByText('3 business days')).toBeInTheDocument();
  });

  it('handles the same date and singular wording', () => {
    render(<BusinessDaysCalculatorTool />);
    count('2024-03-04', '2024-03-04');
    expect(screen.getByText('1 business day')).toBeInTheDocument();
  });

  it('explains reversed dates', () => {
    render(<BusinessDaysCalculatorTool />);
    count('2024-03-08', '2024-03-04');
    expect(screen.getByText(/end date is before the start date/i)).toBeInTheDocument();
    expect(screen.getByText('5 business days')).toBeInTheDocument();
  });

  it('counts across a leap day', () => {
    render(<BusinessDaysCalculatorTool />);
    count('2024-02-28', '2024-03-01');
    expect(screen.getByText('3 business days')).toBeInTheDocument();
  });

  it('shows errors for missing and invalid dates', () => {
    render(<BusinessDaysCalculatorTool />);
    count('', '2024-03-01');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a start date.');
    count('2024-03-01', '');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an end date.');
  });

  it('offers copy and reset', () => {
    render(<BusinessDaysCalculatorTool />);
    count('2024-03-04', '2024-03-08');
    expect(screen.getByRole('button', { name: 'Copy business days' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText(/Start date/)).toHaveValue('');
    expect(screen.queryByText('5 business days')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Include the end date')).toBeChecked();
  });
});
