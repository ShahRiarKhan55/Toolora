import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GpaCalculatorTool } from './GpaCalculatorTool';

function setCourse(rowNumber: number, { credits, grade }: { credits?: string; grade?: string }) {
  if (credits !== undefined) {
    fireEvent.change(screen.getAllByLabelText('Credits')[rowNumber - 1]!, {
      target: { value: credits },
    });
  }
  if (grade !== undefined) {
    fireEvent.change(screen.getAllByLabelText('Grade')[rowNumber - 1]!, {
      target: { value: grade },
    });
  }
}

describe('GpaCalculatorTool', () => {
  it('starts with two course rows', () => {
    render(<GpaCalculatorTool />);
    expect(screen.getAllByLabelText('Credits')).toHaveLength(2);
  });

  it('calculates GPA for the default two courses (both A grade, 3 credits)', () => {
    render(<GpaCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Calculate GPA' }));
    expect(screen.getByText('4.00')).toBeInTheDocument();
  });

  it('recalculates a weighted GPA after editing credits and grade', () => {
    render(<GpaCalculatorTool />);
    setCourse(1, { credits: '4' });
    setCourse(2, { credits: '1', grade: 'F' });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate GPA' }));
    // (4*4.0 + 1*0.0) / 5 = 3.20
    expect(screen.getByText('3.20')).toBeInTheDocument();
  });

  it('adds and removes course rows', () => {
    render(<GpaCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Add course' }));
    expect(screen.getAllByLabelText('Credits')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Remove course 3' }));
    expect(screen.getAllByLabelText('Credits')).toHaveLength(2);
  });

  it('does not allow removing the last remaining course', () => {
    render(<GpaCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove course 2' }));
    expect(screen.getByRole('button', { name: 'Remove course 1' })).toBeDisabled();
  });

  it('shows a validation error and blocks calculation for invalid credits', () => {
    render(<GpaCalculatorTool />);
    setCourse(1, { credits: 'abc' });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate GPA' }));
    const alerts = screen.getAllByRole('alert').map((alert) => alert.textContent);
    expect(alerts.some((text) => /Could not calculate GPA/i.test(text ?? ''))).toBe(true);
    expect(screen.getByText('Enter a valid number of credits.')).toBeInTheDocument();
  });

  it('resets to two blank default courses', () => {
    render(<GpaCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Add course' }));
    fireEvent.click(screen.getByRole('button', { name: 'Calculate GPA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getAllByLabelText('Credits')).toHaveLength(2);
    expect(screen.queryByText('4.00')).not.toBeInTheDocument();
  });
});
