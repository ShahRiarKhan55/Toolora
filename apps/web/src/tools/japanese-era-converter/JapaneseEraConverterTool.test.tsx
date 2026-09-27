import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JapaneseEraConverterTool } from './JapaneseEraConverterTool';

function gregorianSection() {
  return within(screen.getByRole('heading', { name: 'Gregorian date → era' }).closest('div')!);
}

function eraSection() {
  return within(screen.getByRole('heading', { name: 'Era → Gregorian year' }).closest('div')!);
}

describe('JapaneseEraConverterTool', () => {
  it('converts a Gregorian date to its era', () => {
    render(<JapaneseEraConverterTool />);
    fireEvent.change(gregorianSection().getByLabelText('Gregorian date'), {
      target: { value: '2024-01-01' },
    });
    fireEvent.click(gregorianSection().getByRole('button', { name: 'Convert to era' }));
    expect(gregorianSection().getByText('Reiwa 6')).toBeInTheDocument();
  });

  it('shows a validation error for a date before the supported range', () => {
    render(<JapaneseEraConverterTool />);
    fireEvent.change(gregorianSection().getByLabelText('Gregorian date'), {
      target: { value: '1800-01-01' },
    });
    fireEvent.click(gregorianSection().getByRole('button', { name: 'Convert to era' }));
    expect(gregorianSection().getByRole('alert')).toHaveTextContent(/Meiji 1/);
  });

  it('shows a validation error for an empty date', () => {
    render(<JapaneseEraConverterTool />);
    fireEvent.click(gregorianSection().getByRole('button', { name: 'Convert to era' }));
    expect(gregorianSection().getByRole('alert')).toBeInTheDocument();
  });

  it('converts an era year to a Gregorian year', () => {
    render(<JapaneseEraConverterTool />);
    fireEvent.change(eraSection().getByLabelText('Era'), { target: { value: 'heisei' } });
    fireEvent.change(eraSection().getByLabelText('Era year'), { target: { value: '31' } });
    fireEvent.click(eraSection().getByRole('button', { name: 'Convert to Gregorian' }));
    expect(eraSection().getByText('2019')).toBeInTheDocument();
    expect(eraSection().getByText(/does not cover the whole of 2019/)).toBeInTheDocument();
  });

  it('shows a validation error for an era year beyond the era', () => {
    render(<JapaneseEraConverterTool />);
    fireEvent.change(eraSection().getByLabelText('Era'), { target: { value: 'showa' } });
    fireEvent.change(eraSection().getByLabelText('Era year'), { target: { value: '100' } });
    fireEvent.click(eraSection().getByRole('button', { name: 'Convert to Gregorian' }));
    expect(eraSection().getByRole('alert')).toBeInTheDocument();
  });

  it('shows a validation error for a non-numeric era year', () => {
    render(<JapaneseEraConverterTool />);
    fireEvent.change(eraSection().getByLabelText('Era year'), { target: { value: 'abc' } });
    fireEvent.click(eraSection().getByRole('button', { name: 'Convert to Gregorian' }));
    expect(eraSection().getByRole('alert')).toBeInTheDocument();
  });
});
