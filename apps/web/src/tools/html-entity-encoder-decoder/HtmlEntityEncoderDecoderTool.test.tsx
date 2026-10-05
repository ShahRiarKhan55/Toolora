import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HtmlEntityEncoderDecoderTool } from './HtmlEntityEncoderDecoderTool';

const INPUT = /Text or HTML entities/;

function run(value: string, button: 'Encode' | 'Decode') {
  fireEvent.change(screen.getByLabelText(INPUT), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: button }));
}

describe('HtmlEntityEncoderDecoderTool', () => {
  it('encodes HTML-sensitive characters', () => {
    render(<HtmlEntityEncoderDecoderTool />);
    run('<b>"Tom" & \'Jerry\'</b>', 'Encode');
    expect(screen.getByLabelText('Result')).toHaveValue(
      '&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;',
    );
  });

  it('encodes Unicode as numeric entities only when asked', () => {
    render(<HtmlEntityEncoderDecoderTool />);
    run('é日', 'Encode');
    expect(screen.getByLabelText('Result')).toHaveValue('é日');
    fireEvent.click(screen.getByLabelText(/Also encode non-ASCII/));
    fireEvent.click(screen.getByRole('button', { name: 'Encode' }));
    expect(screen.getByLabelText('Result')).toHaveValue('&#233;&#26085;');
  });

  it('decodes entities', () => {
    render(<HtmlEntityEncoderDecoderTool />);
    run('&lt;p&gt;caf&eacute; &amp; &#26085;&lt;/p&gt;', 'Decode');
    expect(screen.getByLabelText('Result')).toHaveValue('<p>café & 日</p>');
  });

  it('reports a malformed entity and shows no result', () => {
    render(<HtmlEntityEncoderDecoderTool />);
    run('a &bogus; b', 'Decode');
    expect(screen.getByRole('alert')).toHaveTextContent('&bogus;');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('never turns decoded markup into DOM: it stays in a read-only textarea', () => {
    const { container } = render(<HtmlEntityEncoderDecoderTool />);
    run('&lt;img src=x onerror=alert(1)&gt;&lt;script&gt;alert(1)&lt;/script&gt;', 'Decode');
    expect(container.querySelector('img, script')).toBeNull();
    const result = screen.getByLabelText<HTMLTextAreaElement>('Result');
    expect(result).toHaveAttribute('readonly');
    expect(result.value).toBe('<img src=x onerror=alert(1)><script>alert(1)</script>');
  });

  it('clears everything and offers copy', () => {
    render(<HtmlEntityEncoderDecoderTool />);
    run('<', 'Encode');
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText(INPUT)).toHaveValue('');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });
});
