import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
  it('announces errors assertively with a text label, not colour alone', () => {
    render(<Alert tone="error">Something broke</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Error: Something broke');
  });

  it.each(['info', 'success', 'warning'] as const)('announces %s politely', (tone) => {
    render(<Alert tone={tone}>Note</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Note');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('defaults to the information tone and shows an optional title', () => {
    render(<Alert title="Heads up">Details</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Information: Heads upDetails');
  });
});
