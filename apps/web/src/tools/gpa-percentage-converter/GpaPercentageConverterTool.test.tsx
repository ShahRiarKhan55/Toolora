import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GpaPercentageConverterTool } from './GpaPercentageConverterTool';

describe('GpaPercentageConverterTool', () => {
  it('states up front that the conversion is an estimate', () => {
    render(<GpaPercentageConverterTool />);
    expect(screen.getByText(/not an official conversion/i)).toBeInTheDocument();
  });

  it('converts a GPA to a percentage and shows the formula', () => {
    render(<GpaPercentageConverterTool />);
    fireEvent.change(screen.getByLabelText(/^GPA \(0 to 4\)/), { target: { value: '3.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByText('87.5%')).toBeInTheDocument();
    expect(screen.getByText(/GPA ÷ 4 × 100/)).toBeInTheDocument();
  });

  it('changes the allowed range with the scale', () => {
    render(<GpaPercentageConverterTool />);
    fireEvent.change(screen.getByLabelText('GPA scale'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/^GPA \(0 to 10\)/), { target: { value: '8.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('converts a percentage to a GPA', () => {
    render(<GpaPercentageConverterTool />);
    fireEvent.change(screen.getByLabelText('Convert'), { target: { value: 'percentage-to-gpa' } });
    fireEvent.change(screen.getByLabelText(/^Percentage/), { target: { value: '87.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('announces an out-of-range value and shows no result', () => {
    render(<GpaPercentageConverterTool />);
    fireEvent.change(screen.getByLabelText(/^GPA \(0 to 4\)/), { target: { value: '4.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/between 0 and 4/);
    expect(screen.queryByText(/Estimated/)).not.toBeInTheDocument();
  });

  it('announces empty input', () => {
    render(<GpaPercentageConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a gpa/i);
  });

  it('resets the value and result', () => {
    render(<GpaPercentageConverterTool />);
    fireEvent.change(screen.getByLabelText(/^GPA \(0 to 4\)/), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText(/^GPA \(0 to 4\)/)).toHaveValue('');
    expect(screen.queryByText(/Estimated/)).not.toBeInTheDocument();
  });
});
