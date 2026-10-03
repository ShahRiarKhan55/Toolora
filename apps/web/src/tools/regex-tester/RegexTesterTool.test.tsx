import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RegexTesterTool } from './RegexTesterTool';

function setup(pattern: string, text: string) {
  render(<RegexTesterTool />);
  fireEvent.change(screen.getByLabelText('Regular expression'), { target: { value: pattern } });
  fireEvent.change(screen.getByLabelText('Test string'), { target: { value: text } });
}

describe('RegexTesterTool', () => {
  it('shows nothing, and no error, while the pattern is empty', () => {
    render(<RegexTesterTool />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/^(No matches|\d+\+? matches?)/)).not.toBeInTheDocument();
  });

  it('lists every match with its position (global is on by default)', () => {
    setup('\\d+', 'a12 b345');
    expect(screen.getByText('2 matches')).toBeInTheDocument();
    expect(screen.getByText(/position 1–3/)).toBeInTheDocument();
    expect(screen.getByText(/position 5–8/)).toBeInTheDocument();
  });

  it('shows capture groups', () => {
    setup('(?<word>b)(c)', 'abc');
    expect(screen.getByText(/Named group “word”/)).toBeInTheDocument();
    expect(screen.getByText(/Group 2:/)).toBeInTheDocument();
  });

  it('says when nothing matches', () => {
    setup('zzz', 'abc');
    expect(screen.getByText(/No matches/)).toBeInTheDocument();
  });

  it('announces an invalid pattern and shows no results', () => {
    setup('(oops', 'abc');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/match/i, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('turning off the g flag reports only the first match', () => {
    setup('\\d', 'a1b2');
    fireEvent.click(screen.getByRole('checkbox', { name: /^g \(global\)/ }));
    expect(screen.getByText('1 match')).toBeInTheDocument();
  });

  it('renders matched text as text, never as markup', () => {
    setup('<b>.*</b>', 'x <b>bold</b> y');
    expect(document.querySelector('main b, code b')).toBeNull();
    expect(screen.getByText('<b>bold</b>')).toBeInTheDocument();
  });

  it('loads an example and resets everything', () => {
    render(<RegexTesterTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Load example' }));
    expect(screen.getByText('2 matches')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByLabelText('Regular expression')).toHaveValue('');
    expect(screen.getByLabelText('Test string')).toHaveValue('');
    expect(screen.queryByText(/match/i, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('offers to copy the matched text', () => {
    setup('a', 'aa');
    expect(screen.getByRole('button', { name: 'Copy matched text' })).toBeInTheDocument();
  });
});
