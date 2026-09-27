import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UnixTimestampConverterTool } from './UnixTimestampConverterTool';

function timestampSection() {
  return within(screen.getByRole('heading', { name: 'Timestamp → date' }).closest('div')!);
}

function dateSection() {
  return within(screen.getByRole('heading', { name: 'Date → timestamp' }).closest('div')!);
}

describe('UnixTimestampConverterTool', () => {
  it('converts a seconds timestamp to UTC and local time', () => {
    render(<UnixTimestampConverterTool />);
    fireEvent.change(timestampSection().getByLabelText('Unix timestamp'), {
      target: { value: '0' },
    });
    fireEvent.click(timestampSection().getByRole('button', { name: 'Convert' }));
    expect(timestampSection().getByText('1970-01-01T00:00:00.000Z')).toBeInTheDocument();
  });

  it('converts a milliseconds timestamp', () => {
    render(<UnixTimestampConverterTool />);
    fireEvent.change(timestampSection().getByLabelText('Unit'), {
      target: { value: 'milliseconds' },
    });
    fireEvent.change(timestampSection().getByLabelText('Unix timestamp'), {
      target: { value: '0' },
    });
    fireEvent.click(timestampSection().getByRole('button', { name: 'Convert' }));
    expect(timestampSection().getByText('1970-01-01T00:00:00.000Z')).toBeInTheDocument();
  });

  it('fills in the current time', () => {
    render(<UnixTimestampConverterTool />);
    fireEvent.click(timestampSection().getByRole('button', { name: 'Use current time' }));
    const value = timestampSection().getByLabelText<HTMLInputElement>('Unix timestamp');
    expect(Number(value.value)).toBeGreaterThan(0);
  });

  it('shows a validation error for a non-numeric timestamp', () => {
    render(<UnixTimestampConverterTool />);
    fireEvent.change(timestampSection().getByLabelText('Unix timestamp'), {
      target: { value: 'abc' },
    });
    fireEvent.click(timestampSection().getByRole('button', { name: 'Convert' }));
    expect(timestampSection().getByRole('alert')).toBeInTheDocument();
  });

  it('converts a UTC date and time to seconds and milliseconds', () => {
    render(<UnixTimestampConverterTool />);
    fireEvent.change(dateSection().getByLabelText('Date & time (UTC)'), {
      target: { value: '1970-01-01T00:00' },
    });
    fireEvent.click(dateSection().getByRole('button', { name: 'Convert' }));
    expect(dateSection().getAllByText('0')).toHaveLength(2); // both seconds and milliseconds are 0
  });

  it('shows a validation error for an empty date', () => {
    render(<UnixTimestampConverterTool />);
    fireEvent.click(dateSection().getByRole('button', { name: 'Convert' }));
    expect(dateSection().getByRole('alert')).toBeInTheDocument();
  });
});
