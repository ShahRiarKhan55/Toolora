import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PercentageCalculatorTool } from './PercentageCalculatorTool';

function fill(x: string, y: string, labels: [string, string]) {
  fireEvent.change(screen.getByLabelText(labels[0]), { target: { value: x } });
  fireEvent.change(screen.getByLabelText(labels[1]), { target: { value: y } });
  fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
}

function chooseMode(mode: string) {
  fireEvent.change(screen.getByLabelText('What do you want to work out?'), {
    target: { value: mode },
  });
}

describe('PercentageCalculatorTool', () => {
  it('works out X% of Y', () => {
    render(<PercentageCalculatorTool />);
    fill('15', '80', ['Percentage (X%)', 'Of this value (Y)']);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('15% of 80 is 12.')).toBeInTheDocument();
  });

  it('works out what percent X is of Y', () => {
    render(<PercentageCalculatorTool />);
    chooseMode('what-percent');
    fill('25', '200', ['Part (X)', 'Whole (Y)']);
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('reports a percentage change with its direction', () => {
    render(<PercentageCalculatorTool />);
    chooseMode('change');
    fill('200', '150', ['Old value (X)', 'New value (Y)']);
    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getByText('Decrease of 25%.')).toBeInTheDocument();
  });

  it('increases or decreases by a percentage', () => {
    render(<PercentageCalculatorTool />);
    chooseMode('adjust');
    fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'decrease' } });
    fill('200', '10', ['Starting value (X)', 'Percentage (Y%)']);
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('200 decreased by 10% is 180.')).toBeInTheDocument();
  });

  it('shows an announced error for division by zero and invalid input', () => {
    render(<PercentageCalculatorTool />);
    chooseMode('what-percent');
    fill('5', '0', ['Part (X)', 'Whole (Y)']);
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be 0/);
    fill('abc', '1', ['Part (X)', 'Whole (Y)']);
    expect(screen.getByRole('alert')).toHaveTextContent(/first value/);
  });

  it('clears the previous result when the question changes', () => {
    render(<PercentageCalculatorTool />);
    fill('15', '80', ['Percentage (X%)', 'Of this value (Y)']);
    chooseMode('change');
    expect(screen.queryByText(/is 12/)).not.toBeInTheDocument();
  });

  it('resets the inputs', () => {
    render(<PercentageCalculatorTool />);
    fill('15', '80', ['Percentage (X%)', 'Of this value (Y)']);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Percentage (X%)')).toHaveValue('');
    expect(screen.queryByText('12')).not.toBeInTheDocument();
  });
});
