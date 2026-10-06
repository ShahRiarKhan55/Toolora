import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapanTakeHomePayCalculatorTool } from './JapanTakeHomePayCalculatorTool';

function calculate(salary: string) {
  fireEvent.change(screen.getByLabelText('Monthly salary (JPY)'), { target: { value: salary } });
  fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
}

describe('JapanTakeHomePayCalculatorTool', () => {
  it('shows monthly and annual take-home, a breakdown and the rules year', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    calculate('300000');
    expect(screen.getByText(/rules year 2026 \(令和8年\)/)).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Estimated employee deductions from salary' });
    expect(within(table).getByText('¥15,120')).toBeInTheDocument(); // monthly health insurance
    expect(within(table).getByText('¥27,450')).toBeInTheDocument(); // monthly pension
    expect(screen.getAllByText('¥150,600').length).toBeGreaterThan(0); // annual resident tax
    // 3,600,000 − 528,840 − 44,400 − 150,600 = 2,876,160 a year; ÷ 12 = 239,680 (rounded)
    expect(screen.getAllByText('¥2,876,160').length).toBeGreaterThan(0);
    expect(screen.getAllByText('¥239,680').length).toBeGreaterThan(0);
  });

  it('switches to an annual salary', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    fireEvent.change(screen.getByLabelText('Salary entered as'), { target: { value: 'annual' } });
    fireEvent.change(screen.getByLabelText('Annual salary (JPY)'), {
      target: { value: '3600000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getAllByText('¥239,680').length).toBeGreaterThan(0);
  });

  it('calculates on Enter (form submit)', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    const field = screen.getByLabelText('Monthly salary (JPY)');
    fireEvent.change(field, { target: { value: '300000' } });
    fireEvent.submit(field.closest('form')!);
    expect(screen.getByText(/Estimated take-home pay/)).toBeInTheDocument();
  });

  it('announces errors and shows no result for empty and invalid input', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your salary before deductions');
    calculate('abc');
    expect(screen.getByRole('alert')).toHaveTextContent('whole number');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '70' } });
    calculate('300000');
    expect(screen.getByRole('alert')).toHaveTextContent('18 to 64');
  });

  it('removes the result when a later input is invalid', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    calculate('300000');
    expect(screen.getByRole('table')).toBeInTheDocument();
    calculate('');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('drops insurance lines when the insurance assumptions are cleared', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    fireEvent.click(screen.getByLabelText(/Enrolled in health insurance/));
    fireEvent.click(screen.getByLabelText(/Covered by employment insurance/));
    calculate('99000');
    expect(screen.getAllByText('¥1,188,000').length).toBeGreaterThan(0);
  });

  it('says resident tax is a steady-state estimate that differs from the previous-year basis', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    calculate('300000');
    const note = screen.getByText('Resident tax is a steady-state estimate').closest('div')!;
    expect(note).toHaveTextContent(/as if you earned the same the year before/);
    expect(note).toHaveTextContent(/generally reflects the previous year/);
    expect(note).toHaveTextContent(/municipality sets the final figure/);
    expect(screen.getByText(/Resident tax \(steady-state estimate\)/)).toBeInTheDocument();
    expect(
      screen.getAllByText(/based on the entered income, not last year/).length,
    ).toBeGreaterThan(0);
  });

  it('states which resident-tax amounts it assumes and that they are not nationwide or an exact assessment', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('¥430,000 basic deduction');
    expect(text).toContain('no resident tax at ¥450,000 of employment income or less');
    expect(text).toContain('These are not nationwide rules');
    expect(text).toContain('a Hokkaido village starts at a salary of ¥1.12M');
    expect(text).toContain('Municipality-specific rules are not modelled');
    expect(text).toContain('not an exact municipal assessment');
    expect(text).not.toContain('standard exemption limit');
  });

  it('calls the deductions estimated employee deductions and mentions payroll rounding', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    calculate('300000');
    expect(screen.getByText('Estimated employee deductions')).toBeInTheDocument();
    expect(
      screen.getByText(/can make a payslip differ by about ¥1 per month per line/),
    ).toBeInTheDocument();
  });

  it('lists the NTA year-end adjustment and 2026 table among its sources, each with a rule year', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    expect(
      screen.getByRole('link', { name: /令和８年分 年末調整のしかた（手順などの説明）/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /給与所得控除後の給与等の金額の表/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Rule year: 2026/).length).toBeGreaterThan(5);
  });

  it('resets everything', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    calculate('300000');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Monthly salary (JPY)')).toHaveValue('');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('states it is an estimate, shows assumptions and links the official sources', () => {
    render(<JapanTakeHomePayCalculatorTool />);
    expect(screen.getByText(/not an official tax calculation/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sources and assumptions' })).toBeInTheDocument();
    expect(screen.getByText(/Rules year: 2026 \(令和8年\)/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /No\.1410 Employment income deduction/ });
    expect(link).toHaveAttribute(
      'href',
      'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm',
    );
  });

  it('does not write salary data to browser storage', () => {
    window.localStorage.clear();
    render(<JapanTakeHomePayCalculatorTool />);
    calculate('300000');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
