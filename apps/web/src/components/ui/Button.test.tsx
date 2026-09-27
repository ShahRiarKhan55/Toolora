import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Button, ButtonLink } from './Button';

describe('Button', () => {
  it('renders an accessible button that does not submit forms by default', () => {
    render(<Button>Convert</Button>);
    expect(screen.getByRole('button', { name: 'Convert' })).toHaveAttribute('type', 'button');
  });

  it('can be made a submit button explicitly', () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is focusable from the keyboard', () => {
    render(<Button>Go</Button>);
    const button = screen.getByRole('button', { name: 'Go' });
    button.focus();
    expect(button).toHaveFocus();
  });
});

describe('ButtonLink', () => {
  it('renders a link, not a button, for navigation', () => {
    render(
      <MemoryRouter>
        <ButtonLink href="/tools">Browse tools</ButtonLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Browse tools' })).toHaveAttribute('href', '/tools');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
