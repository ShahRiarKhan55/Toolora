import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe.each([
  ['/privacy', 'Privacy'],
  ['/contact', 'Contact'],
])('%s', (path, title) => {
  it('has one h1 and one main landmark', () => {
    renderAt(path);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('does not invent a contact address while none is configured', () => {
    renderAt(path);
    expect(screen.getByText(/contact details have not been published yet/i)).toBeInTheDocument();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});

describe('privacy page content', () => {
  it('states that registration is disabled and makes no compliance claim', () => {
    renderAt('/privacy');
    expect(screen.getByText(/public registration is disabled/i)).toBeInTheDocument();
    expect(screen.queryByText(/GDPR|CCPA|APPI|compliant/)).not.toBeInTheDocument();
  });

  it('names the currency API exception and the stored tool slugs instead of claiming every tool is local', () => {
    renderAt('/privacy');
    expect(screen.queryByText(/every tool runs in your browser/i)).not.toBeInTheDocument();
    expect(screen.getByText(/the one exception is the currency converter/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /saved in your browser/i })).toBeInTheDocument();
    expect(screen.getByText(/never anything you entered/i)).toBeInTheDocument();
  });
});
