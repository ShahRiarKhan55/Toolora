import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HashGeneratorTool } from './HashGeneratorTool';

const ABC_256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

afterEach(() => {
  vi.unstubAllGlobals();
});

function type(value: string) {
  fireEvent.change(screen.getByLabelText('Text to hash'), { target: { value } });
}

describe('HashGeneratorTool', () => {
  it('shows a prompt and no hashes for empty input', () => {
    render(<HashGeneratorTool />);
    expect(screen.getByText(/Enter some text/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copy SHA/ })).not.toBeInTheDocument();
  });

  it('shows all three hashes with copy buttons', async () => {
    render(<HashGeneratorTool />);
    type('abc');
    expect(await screen.findByText(ABC_256)).toBeInTheDocument();
    expect(screen.getByText(/^cb00753f45a35e8b/)).toBeInTheDocument();
    expect(screen.getByText(/^ddaf35a193617aba/)).toBeInTheDocument();
    for (const name of ['SHA-256', 'SHA-384', 'SHA-512']) {
      expect(screen.getByRole('button', { name: `Copy ${name}` })).toBeEnabled();
    }
  });

  it('updates when the text changes and never shows a stale hash', async () => {
    render(<HashGeneratorTool />);
    type('abc');
    await screen.findByText(ABC_256);
    type('abd');
    expect(screen.queryByText(ABC_256)).not.toBeInTheDocument();
    expect(await screen.findByText(/^[0-9a-f]{64}$/)).not.toHaveTextContent(ABC_256);
  });

  it('clears the input and the hashes', async () => {
    render(<HashGeneratorTool />);
    type('abc');
    await screen.findByText(ABC_256);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('Text to hash')).toHaveValue('');
    expect(screen.queryByText(ABC_256)).not.toBeInTheDocument();
  });

  it('hashes Unicode text', async () => {
    render(<HashGeneratorTool />);
    type('日本語');
    expect(await screen.findByText(/^[0-9a-f]{64}$/)).toBeInTheDocument();
  });

  it('explains when Web Crypto is unavailable', async () => {
    vi.stubGlobal('crypto', undefined);
    render(<HashGeneratorTool />);
    type('abc');
    expect(await screen.findByRole('alert')).toHaveTextContent(/Web Crypto API/);
    expect(screen.queryByText(ABC_256)).not.toBeInTheDocument();
  });
});
