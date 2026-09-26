import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';
import { Card } from './Card';
import { EmptyState } from './EmptyState';

describe('Card', () => {
  it('renders its children in a div by default', () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId('card').tagName).toBe('DIV');
    expect(screen.getByTestId('card')).toHaveTextContent('Content');
  });

  it('can render as a semantic element', () => {
    render(
      <Card as="article" aria-label="Item">
        Content
      </Card>,
    );
    expect(screen.getByRole('article', { name: 'Item' })).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('conveys its status through text', () => {
    render(<Badge tone="warning">Coming soon</Badge>);
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('renders a heading, description and action', () => {
    render(
      <EmptyState title="Nothing here" action={<button type="button">Do it</button>}>
        Try again later.
      </EmptyState>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByText('Try again later.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Do it' })).toBeInTheDocument();
  });

  it('lets the caller choose the heading level', () => {
    render(<EmptyState title="Nothing here" as="h2" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing here' })).toBeInTheDocument();
  });
});
