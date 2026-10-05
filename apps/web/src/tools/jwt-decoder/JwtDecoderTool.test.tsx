import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JwtDecoderTool } from './JwtDecoderTool';

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

function paste(value: string) {
  fireEvent.change(screen.getByLabelText('JWT'), { target: { value } });
}

describe('JwtDecoderTool', () => {
  it('always states that it decodes but does not verify, and that it runs locally', () => {
    render(<JwtDecoderTool />);
    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent(/does not verify/);
    expect(notice).toHaveTextContent(/does not check the signature/);
    expect(notice).toHaveTextContent(/locally in your browser/);
    expect(notice).toHaveTextContent(/sensitive production tokens/);
  });

  it('shows a prompt and no results for empty input', () => {
    render(<JwtDecoderTool />);
    expect(screen.getByText(/Paste a JWT/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Header' })).not.toBeInTheDocument();
  });

  it('decodes the header, payload, claims and signature', () => {
    render(<JwtDecoderTool />);
    paste(SAMPLE);

    const header = within(screen.getByRole('region', { name: 'Header' }));
    expect(header.getByText(/"alg": "HS256"/)).toBeInTheDocument();
    const payload = within(screen.getByRole('region', { name: 'Payload' }));
    expect(payload.getByText(/"name": "John Doe"/)).toBeInTheDocument();

    const claims = within(screen.getByRole('region', { name: 'Registered claims' }));
    expect(claims.getByRole('rowheader', { name: 'sub' })).toBeInTheDocument();
    expect(claims.getByRole('rowheader', { name: 'iat' })).toBeInTheDocument();
    expect(claims.getByText(/2018-01-18 01:30:22 UTC/)).toBeInTheDocument();

    const signature = within(screen.getByRole('region', { name: 'Signature' }));
    expect(signature.getByText('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Signature (not verified)' })).toBeInTheDocument();
  });

  it('offers copy buttons for the header and payload', () => {
    render(<JwtDecoderTool />);
    paste(SAMPLE);
    expect(screen.getByRole('button', { name: 'Copy header' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Copy payload' })).toBeEnabled();
  });

  it('says so when a payload has no registered claims', () => {
    render(<JwtDecoderTool />);
    // {"alg":"none"}.{"a":1}.
    paste('eyJhbGciOiJub25lIn0.eyJhIjoxfQ.');
    expect(screen.getByText(/none of the standard claims/)).toBeInTheDocument();
    expect(screen.getByText(/unsecured token/)).toBeInTheDocument();
  });

  it.each([
    ['not a token', /three parts/],
    ['a.b.c.d', /three parts/],
    ['he+der.payload.sig', /not valid Base64URL/],
    ['aGVsbG8.aGVsbG8.sig', /not valid JSON/],
  ])('shows an announced error for %s', (value, message) => {
    render(<JwtDecoderTool />);
    paste(value);
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.getByLabelText('JWT')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('region', { name: 'Header' })).not.toBeInTheDocument();
  });

  it('renders token content as text, never as HTML', () => {
    const encode = (s: string) =>
      btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payload = encode(JSON.stringify({ sub: '<img src=x onerror=alert(1)>' }));
    const { container } = render(<JwtDecoderTool />);
    paste(`${encode('{"alg":"none"}')}.${payload}.`);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(/<img src=x onerror=alert\(1\)>/).length).toBeGreaterThan(0);
  });

  it('clears the token and the results', () => {
    render(<JwtDecoderTool />);
    paste(SAMPLE);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('JWT')).toHaveValue('');
    expect(screen.queryByRole('region', { name: 'Payload' })).not.toBeInTheDocument();
  });
});
