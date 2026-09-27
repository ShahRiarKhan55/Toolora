import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UuidGeneratorTool } from './UuidGeneratorTool';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('UuidGeneratorTool', () => {
  it('generates a single well-formed UUID by default', () => {
    render(<UuidGeneratorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByText('1 UUID')).toBeInTheDocument();
    const [uuid] = screen
      .getAllByRole('listitem')
      .map((item) => item.querySelector('code')!.textContent);
    expect(uuid).toMatch(UUID_V4_PATTERN);
  });

  it('generates multiple UUIDs', () => {
    render(<UuidGeneratorTool />);
    fireEvent.change(screen.getByLabelText('How many?'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByText('5 UUIDs')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('relabels the button "Regenerate" once UUIDs exist, and changes the list', () => {
    render(<UuidGeneratorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    const button = screen.getByRole('button', { name: 'Regenerate' });
    const first = screen.getAllByRole('listitem')[0]!.querySelector('code')!.textContent;
    fireEvent.click(button);
    const second = screen.getAllByRole('listitem')[0]!.querySelector('code')!.textContent;
    expect(first).not.toBe(second);
  });

  it('shows a validation error for an invalid count', () => {
    render(<UuidGeneratorTool />);
    fireEvent.change(screen.getByLabelText('How many?'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/whole number/i);
  });

  it('shows a validation error above the maximum count', () => {
    render(<UuidGeneratorTool />);
    fireEvent.change(screen.getByLabelText('How many?'), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at most/i);
  });

  it('offers to copy each UUID and to copy all of them', () => {
    render(<UuidGeneratorTool />);
    fireEvent.change(screen.getByLabelText('How many?'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('button', { name: 'Copy all' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Copy' })).toHaveLength(2);
  });

  it('clears the generated list', () => {
    render(<UuidGeneratorTool />);
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('disables Clear when there is nothing generated yet', () => {
    render(<UuidGeneratorTool />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });
});
