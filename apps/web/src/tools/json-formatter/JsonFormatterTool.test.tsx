import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JsonFormatterTool } from './JsonFormatterTool';

describe('JsonFormatterTool', () => {
  it('formats valid JSON with indentation', () => {
    render(<JsonFormatterTool />);
    fireEvent.change(screen.getByLabelText('JSON input'), { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.getByLabelText('Result')).toHaveValue('{\n  "a": 1\n}');
  });

  it('minifies valid JSON', () => {
    render(<JsonFormatterTool />);
    fireEvent.change(screen.getByLabelText('JSON input'), {
      target: { value: '{\n  "a": 1\n}' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Minify' }));
    expect(screen.getByLabelText('Result')).toHaveValue('{"a":1}');
  });

  it('shows a validation error for invalid JSON and no result', () => {
    render(<JsonFormatterTool />);
    fireEvent.change(screen.getByLabelText('JSON input'), { target: { value: '{bad}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Result')).not.toBeInTheDocument();
  });

  it('shows a validation error for empty input', () => {
    render(<JsonFormatterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter some json/i);
  });

  it('loads a working example', () => {
    render(<JsonFormatterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers to copy the result', () => {
    render(<JsonFormatterTool />);
    fireEvent.change(screen.getByLabelText('JSON input'), { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
  });

  it('resets input, output and errors', () => {
    render(<JsonFormatterTool />);
    fireEvent.change(screen.getByLabelText('JSON input'), { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('JSON input')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Result')).not.toBeInTheDocument();
  });

  it('never evaluates the input as code (safe parsing only)', () => {
    render(<JsonFormatterTool />);
    fireEvent.change(screen.getByLabelText('JSON input'), {
      target: { value: '{"x": (function(){ window.__pwned = true; })() }' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Format' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });
});
