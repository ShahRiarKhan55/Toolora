import { TOOLS } from '@toolora/shared';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ToolCard } from './ToolCard';

const tool = TOOLS.find((t) => t.id === 'json-formatter')!;

function renderCard(props: Partial<ComponentProps<typeof ToolCard>> = {}) {
  return render(
    <MemoryRouter>
      <ToolCard tool={tool} {...props} />
    </MemoryRouter>,
  );
}

describe('ToolCard', () => {
  it('links its heading to the tool route', () => {
    renderCard();
    expect(screen.getByRole('link', { name: tool.name })).toHaveAttribute(
      'href',
      '/tools/json-formatter',
    );
  });

  it('shows the tool description', () => {
    renderCard();
    expect(screen.getByText(tool.description)).toBeInTheDocument();
  });

  it('shows the category badge by default', () => {
    renderCard();
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('hides the category badge when asked', () => {
    renderCard({ showCategory: false });
    expect(screen.queryByText('Developer')).not.toBeInTheDocument();
  });

  it('is a labelled article landmark', () => {
    renderCard();
    expect(screen.getByRole('article', { name: tool.name })).toBeInTheDocument();
  });
});
