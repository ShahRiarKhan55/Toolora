import { SITE_NAME } from '@toolora/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the site name as the page heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: SITE_NAME })).toBeInTheDocument();
  });
});
