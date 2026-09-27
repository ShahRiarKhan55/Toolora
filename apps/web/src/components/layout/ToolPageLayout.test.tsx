import { TOOLS } from '@toolora/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ToolPageLayout } from './ToolPageLayout';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Developer Tools', href: '/tools/developer' },
  { label: 'Example tool' },
];

function renderLayout(props: Partial<Parameters<typeof ToolPageLayout>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ToolPageLayout
        title="Example tool"
        description="Does one example thing."
        breadcrumbs={BREADCRUMBS}
        {...props}
      >
        <p>Workspace content</p>
      </ToolPageLayout>
    </MemoryRouter>,
  );
}

describe('ToolPageLayout', () => {
  it('renders the title as the single h1, with the description', () => {
    renderLayout();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Example tool' })).toBeInTheDocument();
    expect(screen.getByText('Does one example thing.')).toBeInTheDocument();
  });

  it('renders the children inside the labelled workspace', () => {
    renderLayout();
    const workspace = screen.getByRole('region', { name: 'Tool workspace' });
    expect(within(workspace).getByText('Workspace content')).toBeInTheDocument();
  });

  it('renders breadcrumbs with the current page marked and not linked', () => {
    renderLayout();
    const nav = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
    expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(nav.getByRole('link', { name: 'Developer Tools' })).toHaveAttribute(
      'href',
      '/tools/developer',
    );
    expect(nav.getByText('Example tool')).toHaveAttribute('aria-current', 'page');
    expect(nav.queryByRole('link', { name: 'Example tool' })).not.toBeInTheDocument();
  });

  it('renders no explanatory sections when none are given', () => {
    renderLayout();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('renders how-to-use, about and FAQ sections in order when given', () => {
    renderLayout({
      howToUse: <p>Type, then press the button.</p>,
      about: <p>Why this tool exists.</p>,
      faq: [
        { question: 'Is it free?', answer: <p>Yes.</p> },
        { question: 'Is it private?', answer: <p>Yes, it runs locally.</p> },
      ],
    });
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['How to use', 'About this tool', 'Frequently asked questions']);
    expect(screen.getByText('Type, then press the button.')).toBeInTheDocument();
    expect(screen.getByText('Why this tool exists.')).toBeInTheDocument();
    expect(screen.getByText('Is it free?')).toBeInTheDocument();
    expect(screen.getByText('Yes, it runs locally.')).toBeInTheDocument();
  });

  it('renders FAQ entries as natively expandable disclosures', () => {
    const { container } = renderLayout({
      faq: [{ question: 'Is it free?', answer: <p>Yes.</p> }],
    });
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(within(details as HTMLElement).getByText('Is it free?').tagName).toBe('SUMMARY');
  });

  it(
    'gives the FAQ chevron an explicit size (regression: an overridden className with no ' +
      'size-* class leaves an inline SVG at browser-default, oversized dimensions)',
    () => {
      const { container } = renderLayout({
        faq: [{ question: 'Is it free?', answer: <p>Yes.</p> }],
      });
      const chevron = container.querySelector('summary svg');
      expect(chevron?.getAttribute('class')).toMatch(/\bsize-\d+\b/);
    },
  );

  it('omits the FAQ section for an empty list', () => {
    renderLayout({ faq: [] });
    expect(screen.queryByText('Frequently asked questions')).not.toBeInTheDocument();
  });

  it('only shows the privacy note for tools that declare they run locally', () => {
    const { unmount } = renderLayout();
    expect(screen.queryByText(/runs in your browser/i)).not.toBeInTheDocument();
    unmount();

    renderLayout({ localOnly: true });
    expect(screen.getByText(/runs in your browser/i)).toBeInTheDocument();
  });

  it('renders no related-tools section when none are given', () => {
    renderLayout();
    expect(screen.queryByRole('heading', { name: 'Related tools' })).not.toBeInTheDocument();
  });

  it('renders no related-tools section for an empty list', () => {
    renderLayout({ relatedTools: [] });
    expect(screen.queryByRole('heading', { name: 'Related tools' })).not.toBeInTheDocument();
  });

  it('renders each related tool as a link to its own page', () => {
    const related = TOOLS.slice(0, 3);
    renderLayout({ relatedTools: related });

    const section = within(
      screen.getByRole('heading', { name: 'Related tools' }).closest('section')!,
    );
    for (const tool of related) {
      expect(section.getByRole('link', { name: tool.name })).toHaveAttribute(
        'href',
        `/tools/${tool.slug}`,
      );
    }
  });
});
