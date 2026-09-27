import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WordCounterTool } from './WordCounterTool';

describe('WordCounterTool', () => {
  it('starts at all zeros with no reading time', () => {
    render(<WordCounterTool />);
    expect(screen.getAllByText('0')).toHaveLength(5);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('updates counts live as text is typed', () => {
    render(<WordCounterTool />);
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'Hello world. How are you?' },
    });
    expect(screen.getByText('5')).toBeInTheDocument(); // words
    expect(screen.getByText('2')).toBeInTheDocument(); // sentences
  });

  it('shows an estimated reading time once there is text', () => {
    render(<WordCounterTool />);
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: 'A short bit of text.' },
    });
    expect(screen.getByText('1 minute')).toBeInTheDocument();
  });

  it('does not count whitespace-only input as a word', () => {
    render(<WordCounterTool />);
    fireEvent.change(screen.getByPlaceholderText('Paste or type your text here…'), {
      target: { value: '   ' },
    });
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('clears the text and resets counts', () => {
    render(<WordCounterTool />);
    const textarea = screen.getByPlaceholderText('Paste or type your text here…');
    fireEvent.change(textarea, { target: { value: 'Some words here' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(textarea).toHaveValue('');
    expect(screen.getAllByText('0')).toHaveLength(5);
  });

  it('disables Clear when the text is already empty', () => {
    render(<WordCounterTool />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });
});
