import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapanFurusatoNozeiLimitEstimatorTool } from './JapanFurusatoNozeiLimitEstimatorTool';

function estimate(salary: string) {
  fireEvent.change(screen.getByLabelText('Yearly salary before deductions (JPY)'), {
    target: { value: salary },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Estimate limit' }));
}

describe('JapanFurusatoNozeiLimitEstimatorTool', () => {
  it('shows an approximate limit labelled as an estimate with the rules year', () => {
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    estimate('5000000');
    expect(screen.getByText(/rules year 2026 \(令和8年\)/)).toBeInTheDocument();
    expect(
      screen.getByText('Estimated upper limit for the year (approximate)'),
    ).toBeInTheDocument();
    expect(screen.getByText('¥58,092')).toBeInTheDocument();
    expect(screen.getByText(/does not give the same benefit/)).toBeInTheDocument();
  });

  it('explains how the number was reached', () => {
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    estimate('5000000');
    expect(screen.getByText('How this estimate was reached')).toBeInTheDocument();
    expect(screen.getByText('¥238,100')).toBeInTheDocument(); // resident income tax before donations
    expect(screen.getByText(/84\.895% \(90% − 5% × 1\.021\)/)).toBeInTheDocument();
  });

  it('responds to household inputs', () => {
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    fireEvent.change(screen.getByLabelText('Spouse'), { target: { value: 'deduction' } });
    estimate('5000000');
    expect(screen.getByText('¥50,318')).toBeInTheDocument();
  });

  it('says there is no benefit when there is no resident income tax', () => {
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    estimate('1000000');
    expect(screen.getByText('No deduction benefit at this income')).toBeInTheDocument();
    expect(
      screen.queryByText('Estimated upper limit for the year (approximate)'),
    ).not.toBeInTheDocument();
  });

  it('announces errors and clears a stale result', () => {
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    estimate('5000000');
    estimate('');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your yearly salary');
    expect(screen.queryByText('¥58,092')).not.toBeInTheDocument();
    estimate('abc');
    expect(screen.getByRole('alert')).toHaveTextContent('whole number');
    fireEvent.change(screen.getByLabelText('Dependants aged 16+ (not 19–22)'), {
      target: { value: '-1' },
    });
    estimate('5000000');
    expect(screen.getByRole('alert')).toHaveTextContent('number of dependants');
  });

  it('estimates on Enter and resets', () => {
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    const field = screen.getByLabelText('Yearly salary before deductions (JPY)');
    fireEvent.change(field, { target: { value: '5000000' } });
    fireEvent.submit(field.closest('form')!);
    expect(screen.getByText('¥58,092')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Yearly salary before deductions (JPY)')).toHaveValue('');
    expect(screen.queryByText('¥58,092')).not.toBeInTheDocument();
  });

  it('states it is an estimate that depends on the final tax situation, and links sources', () => {
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    expect(
      screen.getByText(/depends on your final tax situation and deductions/),
    ).toBeInTheDocument();
    expect(screen.getByText(/not a guaranteed exact limit/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sources and assumptions' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Ministry of Internal Affairs and Communications/ }),
    ).toHaveAttribute('href', expect.stringContaining('soumu.go.jp'));
  });

  it('says the resident tax is the 令和9年度 tax on 2026 income with a Nagoya-stated exemption, not municipality-specific', () => {
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('令和9年度 tax on your 2026 income');
    expect(text).toContain('exemption limit Nagoya City states');
    expect(text).toContain('not any municipality-specific rule or local add-on');
  });

  it('does not write salary data to browser storage', () => {
    window.localStorage.clear();
    render(<JapanFurusatoNozeiLimitEstimatorTool />);
    estimate('5000000');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
