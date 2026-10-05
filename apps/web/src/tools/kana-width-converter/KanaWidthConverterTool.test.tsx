import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KanaWidthConverterTool } from './KanaWidthConverterTool';

function type(value: string) {
  fireEvent.change(screen.getByLabelText('Text'), { target: { value } });
}

describe('KanaWidthConverterTool', () => {
  it('shows no result for empty input', () => {
    render(<KanaWidthConverterTool />);
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });

  it('converts hiragana to katakana by default', () => {
    render(<KanaWidthConverterTool />);
    type('こんにちは World');
    expect(screen.getByLabelText('Result')).toHaveValue('コンニチハ World');
  });

  it('converts katakana to hiragana', () => {
    render(<KanaWidthConverterTool />);
    fireEvent.change(screen.getByLabelText('Conversion'), {
      target: { value: 'katakana-to-hiragana' },
    });
    type('ラーメン');
    expect(screen.getByLabelText('Result')).toHaveValue('らーめん');
  });

  it('converts width in both directions and offers a scope only then', () => {
    render(<KanaWidthConverterTool />);
    expect(screen.queryByLabelText('Characters to convert')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Conversion'), { target: { value: 'to-halfwidth' } });
    type('ＡＢＣ　ガ');
    expect(screen.getByLabelText('Result')).toHaveValue('ABC ｶﾞ');

    fireEvent.change(screen.getByLabelText('Characters to convert'), {
      target: { value: 'katakana' },
    });
    expect(screen.getByLabelText('Result')).toHaveValue('ＡＢＣ　ｶﾞ');

    fireEvent.change(screen.getByLabelText('Conversion'), { target: { value: 'to-fullwidth' } });
    type('ｶﾞ');
    expect(screen.getByLabelText('Result')).toHaveValue('ガ');
  });

  it('clears the input and the result', () => {
    render(<KanaWidthConverterTool />);
    type('あ');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('Text')).toHaveValue('');
    expect(screen.queryByLabelText('Result')).not.toBeInTheDocument();
  });
});
