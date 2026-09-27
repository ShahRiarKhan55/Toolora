import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Base64EncoderDecoderTool } from './Base64EncoderDecoderTool';

describe('Base64EncoderDecoderTool', () => {
  it('encodes text to Base64 by default', () => {
    render(<Base64EncoderDecoderTool />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }));
    expect(screen.getByLabelText('Result')).toHaveValue('SGVsbG8=');
  });

  it('encodes Unicode text correctly', () => {
    render(<Base64EncoderDecoderTool />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: '日本語' } });
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }));
    const encoded = screen.getByLabelText<HTMLTextAreaElement>('Result');
    expect(encoded.value).not.toBe('');
    expect(atob(encoded.value).length).toBeGreaterThan(0);
  });

  it('switches to decode mode and decodes Base64', () => {
    render(<Base64EncoderDecoderTool />);
    fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'decode' } });
    fireEvent.change(screen.getByLabelText('Base64'), { target: { value: 'SGVsbG8=' } });
    fireEvent.click(screen.getByRole('button', { name: 'Decode' }));
    expect(screen.getByLabelText('Result')).toHaveValue('Hello');
  });

  it('shows a validation error for invalid Base64', () => {
    render(<Base64EncoderDecoderTool />);
    fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'decode' } });
    fireEvent.change(screen.getByLabelText('Base64'), { target: { value: 'not base64!!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Decode' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/not valid base64/i);
  });

  it('clears input and output when switching modes', () => {
    render(<Base64EncoderDecoderTool />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }));
    fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'decode' } });
    expect(screen.getByLabelText('Base64')).toHaveValue('');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('swaps the result into the input and flips mode', () => {
    render(<Base64EncoderDecoderTool />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }));
    fireEvent.click(screen.getByRole('button', { name: /Swap/ }));
    expect(screen.getByLabelText('Base64')).toHaveValue('SGVsbG8=');
  });

  it('resets everything', () => {
    render(<Base64EncoderDecoderTool />);
    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Text')).toHaveValue('');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });
});
