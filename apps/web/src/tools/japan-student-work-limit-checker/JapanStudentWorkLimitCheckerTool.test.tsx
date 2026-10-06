import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapanStudentWorkLimitCheckerTool } from './JapanStudentWorkLimitCheckerTool';

function check(hours: string, income: string) {
  fireEvent.change(screen.getByLabelText('Hours worked per week'), { target: { value: hours } });
  fireEvent.change(screen.getByLabelText('Pay from work in 2026 (JPY)'), {
    target: { value: income },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Check' }));
}

describe('JapanStudentWorkLimitCheckerTool', () => {
  it('shows the immigration verdict and separate tax and insurance lines', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    check('24', '1200000');
    expect(screen.getByText('Within 28 hours a week')).toBeInTheDocument();
    expect(screen.getByText(/Resident tax \(住民税\)/)).toBeInTheDocument();
    expect(screen.getByText(/Health insurance as someone's dependant/)).toBeInTheDocument();
    expect(screen.getByText(/Four separate systems/)).toBeInTheDocument();
    expect(screen.getByText(/rules year 2026 \(令和8年\)/)).toBeInTheDocument();
  });

  it('flags more than 28 hours a week', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    check('30', '900000');
    expect(screen.getByText('Over 28 hours a week')).toBeInTheDocument();
    expect(screen.getByText('Over the limit', { selector: 'span' })).toBeInTheDocument();
  });

  it('asks for the longest day only when a long vacation is selected', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    expect(screen.queryByLabelText('Longest working day (hours)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/long vacation set by my school/));
    expect(screen.getByLabelText('Longest working day (hours)')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Hours worked per week'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Pay from work in 2026 (JPY)'), {
      target: { value: '300000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert')).toHaveTextContent('longest working day');
    fireEvent.change(screen.getByLabelText('Longest working day (hours)'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Within 8 hours a day for a long vacation')).toBeInTheDocument();
  });

  it('hides the vacation option for statuses it does not apply to', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    fireEvent.change(screen.getByLabelText('Your status of residence'), {
      target: { value: 'dependant-permitted' },
    });
    expect(screen.queryByLabelText(/long vacation set by my school/)).not.toBeInTheDocument();
  });

  it('announces errors and clears a previous result', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    check('24', '1200000');
    expect(screen.getByText(/Four separate systems/)).toBeInTheDocument();
    check('', '1200000');
    expect(screen.getByRole('alert')).toHaveTextContent('working hours per week');
    expect(screen.queryByText(/Four separate systems/)).not.toBeInTheDocument();
    check('24', 'lots');
    expect(screen.getByRole('alert')).toHaveTextContent('whole number');
  });

  it('checks on Enter, resets, and states that it is not advice', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    const hours = screen.getByLabelText('Hours worked per week');
    fireEvent.change(hours, { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Pay from work in 2026 (JPY)'), {
      target: { value: '500000' },
    });
    fireEvent.submit(hours.closest('form')!);
    expect(screen.getByText(/Four separate systems/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Hours worked per week')).toHaveValue('');
    expect(screen.queryByText(/Four separate systems/)).not.toBeInTheDocument();
    expect(screen.getByText(/not legal, tax or immigration advice/)).toBeInTheDocument();
  });

  it('shows employer social insurance as separate conditions with no wage threshold', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    fireEvent.change(screen.getByLabelText('Does your employer have 51 or more employees?'), {
      target: { value: 'over50' },
    });
    check('20', '1200000');
    expect(
      screen.getByText(/These are separate conditions, not an income limit/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Scheduled work of 20 hours or more a week/)).toBeInTheDocument();
    expect(screen.getByText('Employer with 51 or more employees')).toBeInTheDocument();
    expect(screen.getByText('Not a student')).toBeInTheDocument();
    expect(screen.getByText('Monthly wage of ¥88,000 or more')).toBeInTheDocument();
    expect(screen.getByText('No longer a condition')).toBeInTheDocument();
    expect(screen.getByText(/abolished on 1 October 2026/)).toBeInTheDocument();
    // 20 hours and a large employer: two separate conditions are met, the student exclusion still applies
    expect(screen.getAllByText('Condition met', { selector: 'span' })).toHaveLength(2);
    expect(screen.getByText('Applies to students')).toBeInTheDocument();
  });

  it('does not present the resident-tax exemption limit as a nationwide rule', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    check('24', '1200000');
    const text = document.body.textContent ?? '';
    expect(text).toContain('this is not a nationwide rule');
    expect(text).toContain('This is not a nationwide rule: some municipalities use a lower limit');
    expect(text).not.toContain('standard exemption limit');
  });

  it('lists the official sources', () => {
    render(<JapanStudentWorkLimitCheckerTool />);
    expect(screen.getByRole('heading', { name: 'Sources and assumptions' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Immigration Services Agency of Japan: 「留学」/ }),
    ).toHaveAttribute(
      'href',
      'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00003.html',
    );
  });

  it('does not write anything to browser storage', () => {
    window.localStorage.clear();
    render(<JapanStudentWorkLimitCheckerTool />);
    check('24', '1200000');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
