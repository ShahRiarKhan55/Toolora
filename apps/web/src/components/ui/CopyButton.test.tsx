import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from './CopyButton';

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

async function clickCopy(name = 'Copy') {
  fireEvent.click(screen.getByRole('button', { name }));
  // Let the clipboard promise settle and React apply the resulting state update.
  await act(() => Promise.resolve());
}

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('CopyButton', () => {
  it('copies the text and confirms visually and to screen readers', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<CopyButton text="hello" />);

    await clickCopy();

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard.');
  });

  it('goes back to its normal label after a moment', async () => {
    vi.useFakeTimers();
    stubClipboard(vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined));
    render(<CopyButton text="hello" />);

    await clickCopy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('reports failure when the clipboard rejects the write', async () => {
    stubClipboard(vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error('denied')));
    render(<CopyButton text="hello" />);

    await clickCopy();

    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copy failed.');
  });

  it('reports failure when the Clipboard API is unavailable', async () => {
    render(<CopyButton text="hello" />);

    await clickCopy();

    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
  });

  it('is disabled when there is nothing to copy', () => {
    render(<CopyButton text="" />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
  });

  it('supports a custom label', () => {
    render(<CopyButton text="x" label="Copy result" />);
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
  });
});
