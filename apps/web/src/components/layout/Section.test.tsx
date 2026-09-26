import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container } from './Container';
import { PageHeader } from './PageHeader';
import { Section } from './Section';

describe('Section', () => {
  it('is a landmark region named by its heading', () => {
    render(
      <Section title="Categories" description="Pick one">
        <p>Body</p>
      </Section>,
    );
    const region = screen.getByRole('region', { name: 'Categories' });
    expect(region).toHaveTextContent('Pick one');
    expect(region).toHaveTextContent('Body');
    expect(screen.getByRole('heading', { level: 2, name: 'Categories' })).toBeInTheDocument();
  });

  it('exposes an id so it can be a link target', () => {
    render(
      <Section id="categories" title="Categories">
        Body
      </Section>,
    );
    expect(screen.getByRole('region', { name: 'Categories' })).toHaveAttribute('id', 'categories');
  });
});

describe('Container', () => {
  it('renders its children', () => {
    render(<Container>Inside</Container>);
    expect(screen.getByText('Inside')).toBeInTheDocument();
  });
});

describe('PageHeader', () => {
  it('renders the h1, description and extra content', () => {
    render(
      <PageHeader title="Title" description="Lead text">
        <span>Extra</span>
      </PageHeader>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Lead text')).toBeInTheDocument();
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });
});
