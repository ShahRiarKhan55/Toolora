import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TextCaseConverterTool } from './TextCaseConverterTool';

function type(value: string) {
  fireEvent.change(screen.getByLabelText('Text'), { target: { value } });
}

describe('TextCaseConverterTool', () => {
  it('shows nothing until there is input', () => {
    render(<TextCaseConverterTool />);
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('converts live to the selected case', () => {
    render(<TextCaseConverterTool />);
    type('hello big world');
    expect(screen.getByLabelText('Result')).toHaveValue('Hello Big World');
    fireEvent.change(screen.getByLabelText('Convert to'), { target: { value: 'snake' } });
    expect(screen.getByLabelText('Result')).toHaveValue('hello_big_world');
    fireEvent.change(screen.getByLabelText('Convert to'), { target: { value: 'camel' } });
    expect(screen.getByLabelText('Result')).toHaveValue('helloBigWorld');
  });

  it('keeps multi-line text on separate lines', () => {
    render(<TextCaseConverterTool />);
    fireEvent.change(screen.getByLabelText('Convert to'), { target: { value: 'kebab' } });
    type('one two\nthree four');
    expect(screen.getByLabelText('Result')).toHaveValue('one-two\nthree-four');
  });

  it('offers every supported case', () => {
    render(<TextCaseConverterTool />);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual([
      'lowercase',
      'UPPERCASE',
      'Title Case',
      'Sentence case',
      'camelCase',
      'PascalCase',
      'snake_case',
      'kebab-case',
    ]);
  });

  it('clears the input and result and offers copy', () => {
    render(<TextCaseConverterTool />);
    type('abc');
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('Text')).toHaveValue('');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });
});
