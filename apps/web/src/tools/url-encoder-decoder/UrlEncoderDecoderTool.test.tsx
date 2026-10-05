import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UrlEncoderDecoderTool } from './UrlEncoderDecoderTool';

const INPUT = /Text or percent-encoded string/;

function run(value: string, button: 'Encode' | 'Decode') {
  fireEvent.change(screen.getByLabelText(INPUT), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: button }));
}

describe('UrlEncoderDecoderTool', () => {
  it('encodes Unicode and punctuation', () => {
    render(<UrlEncoderDecoderTool />);
    run('café & 日本', 'Encode');
    expect(screen.getByLabelText('Result')).toHaveValue('caf%C3%A9%20%26%20%E6%97%A5%E6%9C%AC');
  });

  it('decodes percent-encoded text', () => {
    render(<UrlEncoderDecoderTool />);
    run('caf%C3%A9%20%26', 'Decode');
    expect(screen.getByLabelText('Result')).toHaveValue('café &');
  });

  it('shows an error and no result for a malformed sequence', () => {
    render(<UrlEncoderDecoderTool />);
    run('100%', 'Decode');
    expect(screen.getByRole('alert')).toHaveTextContent(/not valid percent-encoding/i);
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('clears a previous error when encoding afterwards', () => {
    render(<UrlEncoderDecoderTool />);
    run('%', 'Decode');
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Result')).toHaveValue('%25');
  });

  it('explains the component-encoding behaviour next to the input', () => {
    render(<UrlEncoderDecoderTool />);
    expect(screen.getByText(/one URL component/)).toBeInTheDocument();
  });

  it('clears input, result and error', () => {
    render(<UrlEncoderDecoderTool />);
    run('a b', 'Encode');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText(INPUT)).toHaveValue('');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('offers a copy button for the result', () => {
    render(<UrlEncoderDecoderTool />);
    run('a b', 'Encode');
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
  });
});
