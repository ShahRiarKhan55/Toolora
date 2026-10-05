import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeZoneConverterTool } from './TimeZoneConverterTool';

function enter(date: string, time: string) {
  fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: date } });
  fireEvent.change(screen.getByLabelText(/^Time/), { target: { value: time } });
}

afterEach(() => vi.useRealTimers());

describe('TimeZoneConverterTool', () => {
  it('shows nothing until a date or time is entered', () => {
    render(<TimeZoneConverterTool />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/^In /)).not.toBeInTheDocument();
  });

  it('does not show an error while only one of date and time has been entered', () => {
    render(<TimeZoneConverterTool />);
    fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: '2024-07-01' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('converts Tokyo to New York (default zones) with offsets and a day shift note', () => {
    render(<TimeZoneConverterTool />);
    enter('2024-07-01', '12:00');
    expect(screen.getByText('In America/New_York')).toBeInTheDocument();
    expect(screen.getByText('23:00')).toBeInTheDocument();
    expect(screen.getByText(/Sunday, June 30, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Asia\/Tokyo: Japan Standard Time \(UTC\+9\)/)).toBeInTheDocument();
    expect(screen.getByText(/America\/New_York: .*\(UTC-4\)/)).toBeInTheDocument();
    expect(screen.getByText(/1 day before the date you entered/)).toBeInTheDocument();
  });

  it('converts to Dhaka', () => {
    render(<TimeZoneConverterTool />);
    fireEvent.change(screen.getByLabelText('To time zone'), { target: { value: 'Asia/Dhaka' } });
    enter('2024-03-04', '12:00');
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('swaps the two zones and recomputes', () => {
    render(<TimeZoneConverterTool />);
    enter('2024-01-15', '09:00');
    fireEvent.click(screen.getByRole('button', { name: 'Swap time zones' }));
    expect(screen.getByLabelText('From time zone')).toHaveValue('America/New_York');
    expect(screen.getByLabelText('To time zone')).toHaveValue('Asia/Tokyo');
    expect(screen.getByText('In Asia/Tokyo')).toBeInTheDocument();
    expect(screen.getByText('23:00')).toBeInTheDocument();
  });

  it('fills in the current time of the From zone', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-03-04T15:30:45Z'));
    render(<TimeZoneConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: /Use current time in Asia\/Tokyo/ }));
    expect(screen.getByLabelText(/^Date/)).toHaveValue('2024-03-05');
    expect(screen.getByLabelText(/^Time/)).toHaveValue('00:30');
  });

  it('explains a local time skipped by the daylight-saving change', () => {
    render(<TimeZoneConverterTool />);
    fireEvent.change(screen.getByLabelText('From time zone'), {
      target: { value: 'America/New_York' },
    });
    enter('2024-03-10', '02:30');
    expect(screen.getByRole('alert')).toHaveTextContent(/does not exist/i);
  });

  it('warns about a time that happens twice', () => {
    render(<TimeZoneConverterTool />);
    fireEvent.change(screen.getByLabelText('From time zone'), {
      target: { value: 'America/New_York' },
    });
    enter('2024-11-03', '01:30');
    expect(screen.getByText('This local time happens twice')).toBeInTheDocument();
  });

  it('lists common zones first and offers a copy button', () => {
    render(<TimeZoneConverterTool />);
    const group = screen.getByLabelText('From time zone').querySelector('optgroup');
    expect(group?.label).toBe('Common');
    expect(Array.from(group!.querySelectorAll('option')).map((o) => o.value)).toEqual([
      'Asia/Tokyo',
      'UTC',
      'America/New_York',
      'Europe/London',
      'Asia/Dhaka',
      'Asia/Singapore',
    ]);
    enter('2024-03-04', '12:00');
    expect(screen.getByRole('button', { name: 'Copy converted time' })).toBeInTheDocument();
  });

  it('reports an out-of-range year and resets', () => {
    render(<TimeZoneConverterTool />);
    enter('1800-01-01', '12:00');
    expect(screen.getByRole('alert')).toHaveTextContent(/year between/i);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText(/^Date/)).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
