import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultBox } from './ResultBox';

describe('ResultBox', () => {
  it('shows the label and value', () => {
    render(<ResultBox label="Result" value="42" />);
    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('is politely announced as it changes', () => {
    render(<ResultBox label="Result" value="42" />);
    expect(screen.getByText('42').closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('offers a copy button for the value', () => {
    render(<ResultBox label="Result" value="42" />);
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
  });

  it('renders custom children instead of the plain value when given', () => {
    render(
      <ResultBox label="Result" value="42">
        <span>Forty-two</span>
      </ResultBox>,
    );
    expect(screen.getByText('Forty-two')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('disables the copy button when the value is empty', () => {
    render(<ResultBox label="Result" value="" />);
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeDisabled();
  });
});
