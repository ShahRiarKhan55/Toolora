import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PercentageGradeCalculatorTool } from './PercentageGradeCalculatorTool';

describe('PercentageGradeCalculatorTool', () => {
  it('calculates a percentage from marks by default, with a grade', () => {
    render(<PercentageGradeCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText(/Grade: A/)).toBeInTheDocument();
  });

  it('switches to marks-from-percentage and calculates', () => {
    render(<PercentageGradeCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Calculation'), { target: { value: 'to-marks' } });
    fireEvent.change(screen.getByLabelText('Percentage'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Total marks'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('switches to percentage change and calculates a decrease', () => {
    render(<PercentageGradeCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Calculation'), { target: { value: 'change' } });
    fireEvent.change(screen.getByLabelText('Starting value'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Ending value'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });

  it('shows a plus sign for a percentage increase', () => {
    render(<PercentageGradeCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Calculation'), { target: { value: 'change' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('+50%')).toBeInTheDocument();
  });

  it('shows a validation error for a zero total', () => {
    render(<PercentageGradeCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Total marks'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be zero/i);
  });

  it('clears the result when switching modes', () => {
    render(<PercentageGradeCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('90%')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Calculation'), { target: { value: 'change' } });
    expect(screen.queryByText('90%')).not.toBeInTheDocument();
  });

  it('resets all fields and the result', () => {
    render(<PercentageGradeCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Marks obtained'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Marks obtained')).toHaveValue('45');
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
