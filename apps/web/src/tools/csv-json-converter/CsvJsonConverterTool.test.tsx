import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CsvJsonConverterTool } from './CsvJsonConverterTool';

describe('CsvJsonConverterTool', () => {
  it('converts CSV with a quoted field to JSON', () => {
    render(<CsvJsonConverterTool />);
    fireEvent.change(screen.getByLabelText('CSV input'), {
      target: { value: 'city,n\n"Tokyo, Japan",1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(JSON.parse(screen.getByLabelText<HTMLTextAreaElement>('Result').value)).toEqual([
      { city: 'Tokyo, Japan', n: '1' },
    ]);
  });

  it('treats the first row as data when the header box is unticked', () => {
    render(<CsvJsonConverterTool />);
    fireEvent.change(screen.getByLabelText('CSV input'), { target: { value: 'a,b' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /first row is a header/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(JSON.parse(screen.getByLabelText<HTMLTextAreaElement>('Result').value)).toEqual([
      ['a', 'b'],
    ]);
  });

  it('switches direction and converts JSON to CSV', () => {
    render(<CsvJsonConverterTool />);
    fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'json-to-csv' } });
    fireEvent.change(screen.getByLabelText('JSON input'), {
      target: { value: '[{"a":"x,y"}]' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByLabelText('Result')).toHaveValue('a\n"x,y"');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('announces an unterminated quote and shows no result', () => {
    render(<CsvJsonConverterTool />);
    fireEvent.change(screen.getByLabelText('CSV input'), { target: { value: 'a\n"open' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/never closed/i);
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('announces invalid JSON in the JSON → CSV direction', () => {
    render(<CsvJsonConverterTool />);
    fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'json-to-csv' } });
    fireEvent.change(screen.getByLabelText('JSON input'), { target: { value: '{bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows an error for empty input', () => {
    render(<CsvJsonConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter some csv/i);
  });

  it('loads a working example, offers copy, and resets', () => {
    render(<CsvJsonConverterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
    fireEvent.click(screen.getByRole('button', { name: 'Convert' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('CSV input')).toHaveValue('');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });
});
