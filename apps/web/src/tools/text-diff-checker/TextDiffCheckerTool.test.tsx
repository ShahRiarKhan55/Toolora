import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextDiffCheckerTool } from './TextDiffCheckerTool';

function compare(original: string, changed: string) {
  fireEvent.change(screen.getByLabelText('Original text'), { target: { value: original } });
  fireEvent.change(screen.getByLabelText('Changed text'), { target: { value: changed } });
  fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
}

describe('TextDiffCheckerTool', () => {
  it('says the text stays in the browser', () => {
    render(<TextDiffCheckerTool />);
    expect(
      screen.getByText(/stay in your browser: nothing is uploaded or saved/),
    ).toBeInTheDocument();
  });

  it('shows nothing until Compare is pressed', () => {
    render(<TextDiffCheckerTool />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('marks added, removed and unchanged lines in text, not just colour', () => {
    render(<TextDiffCheckerTool />);
    compare('keep\nold\nend', 'keep\nnew\nend');
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 line added, 1 line removed, 2 unchanged.',
    );
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent('Removed');
    expect(rows[1]).toHaveTextContent('old');
    expect(rows[2]).toHaveTextContent('Added');
    expect(rows[2]).toHaveTextContent('new');
    expect(rows[0]).toHaveTextContent('Unchanged');
  });

  it('reports identical and empty inputs', () => {
    render(<TextDiffCheckerTool />);
    compare('same\ntext', 'same\ntext');
    expect(screen.getByRole('status')).toHaveTextContent('The texts are identical.');
    compare('', '');
    expect(screen.getByRole('status')).toHaveTextContent('Both texts are empty.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders text literally and never as HTML', () => {
    const { container } = render(<TextDiffCheckerTool />);
    compare('<img src=x onerror=alert(1)>', '<b>bold</b>');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(within(screen.getByRole('table')).getByText('<b>bold</b>')).toBeInTheDocument();
  });

  it('handles Japanese text', () => {
    render(<TextDiffCheckerTool />);
    compare('こんにちは\n世界', 'こんにちは\n日本');
    expect(screen.getByText('日本')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 line added, 1 line removed');
  });

  it('swaps the texts and clears the result', () => {
    render(<TextDiffCheckerTool />);
    compare('a', 'b');
    fireEvent.click(screen.getByRole('button', { name: 'Swap texts' }));
    expect(screen.getByLabelText('Original text')).toHaveValue('b');
    expect(screen.getByLabelText('Changed text')).toHaveValue('a');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('clears everything', () => {
    render(<TextDiffCheckerTool />);
    compare('a', 'b');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('Original text')).toHaveValue('');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows an announced error when the comparison is too large', () => {
    render(<TextDiffCheckerTool />);
    const lines = (p: string) => Array.from({ length: 2100 }, (_, i) => `${p}${i}`).join('\n');
    compare(lines('a'), lines('b'));
    expect(screen.getByRole('alert')).toHaveTextContent(/too many lines/);
  });
});
