import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownPreviewTool } from './MarkdownPreviewTool';

function renderWith(source: string) {
  const view = render(<MarkdownPreviewTool />);
  fireEvent.change(screen.getByLabelText('Markdown'), { target: { value: source } });
  const preview = view.container.querySelector('[aria-live="polite"]') as HTMLElement;
  return { ...view, preview };
}

describe('MarkdownPreviewTool rendering', () => {
  it('says there is nothing to preview for empty input', () => {
    const { preview } = renderWith('   ');
    expect(preview).toHaveTextContent('Nothing to preview yet.');
  });

  it('renders headings below the page h1, with no skipped levels', () => {
    const { preview } = renderWith('# One\n\n## Two\n\n### Three\n\n#### Four\n\n###### Six');
    const levels = within(preview)
      .getAllByRole('heading')
      .map((h) => Number(h.tagName.slice(1)));
    expect(levels).toEqual([3, 4, 5, 6, 6]);
    expect(within(preview).getByRole('heading', { name: 'One' })).toBeInTheDocument();
  });

  it('renders paragraphs, emphasis and strong text', () => {
    const { preview } = renderWith('Hello *there* and **you**.');
    expect(preview.querySelector('p')).toHaveTextContent('Hello there and you.');
    expect(preview.querySelector('em')).toHaveTextContent('there');
    expect(preview.querySelector('strong')).toHaveTextContent('you');
  });

  it('renders unordered and ordered lists', () => {
    const { preview } = renderWith('- a\n- b\n\n1. one\n2. two');
    expect(preview.querySelectorAll('ul > li')).toHaveLength(2);
    expect(preview.querySelectorAll('ol > li')).toHaveLength(2);
  });

  it('renders links that open safely', () => {
    const { preview } = renderWith('[Toolora](https://example.com/x)');
    const link = within(preview).getByRole('link', { name: 'Toolora' });
    expect(link).toHaveAttribute('href', 'https://example.com/x');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders inline code, fenced code blocks, blockquotes and rules', () => {
    const { preview } = renderWith('Use `x`.\n\n```js\nconst a = 1 < 2;\n```\n\n> quoted\n\n---');
    expect(preview.querySelector('p code')).toHaveTextContent('x');
    expect(preview.querySelector('pre code')).toHaveTextContent('const a = 1 < 2;');
    expect(preview.querySelector('blockquote')).toHaveTextContent('quoted');
    expect(preview.querySelector('hr')).not.toBeNull();
  });

  it('updates as the source changes', () => {
    const { preview } = renderWith('first');
    expect(preview).toHaveTextContent('first');
    fireEvent.change(screen.getByLabelText('Markdown'), { target: { value: 'second' } });
    expect(preview).toHaveTextContent('second');
  });
});

describe('MarkdownPreviewTool safety', () => {
  const payloads = [
    '<script>window.__xss = 1</script>',
    '<img src=x onerror="window.__xss = 1">',
    '<a href="javascript:window.__xss=1" onclick="window.__xss=1">click</a>',
    '<iframe src="https://evil.example"></iframe>',
    '<svg onload="window.__xss=1"></svg>',
    '<div onmouseover="window.__xss=1" style="position:fixed">x</div>',
    '<style>body{display:none}</style>',
    '<details open ontoggle="window.__xss=1">x</details>',
  ];

  it.each(payloads)('does not create dangerous elements or handlers for %s', (payload) => {
    const { preview } = renderWith(`before\n\n${payload}\n\nafter`);
    expect(
      preview.querySelector('script, iframe, img, svg, style, details, div[onmouseover]'),
    ).toBeNull();
    for (const el of Array.from(preview.querySelectorAll('*'))) {
      for (const name of el.getAttributeNames()) {
        expect(name.startsWith('on'), `${el.tagName} ${name}`).toBe(false);
      }
    }
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:x',
  ])('does not keep a %s link target', (url) => {
    const { preview } = renderWith(`[bad](${url})`);
    expect(preview.querySelector('a')).toBeNull();
    expect(preview).toHaveTextContent('bad');
  });

  it('does not render images, so no outside request can start', () => {
    const { preview } = renderWith('![tracker](https://evil.example/pixel.png)');
    expect(preview.querySelector('img')).toBeNull();
  });

  it('keeps the raw HTML out of the live DOM structure while showing the rest', () => {
    const { preview } = renderWith('**kept** <b onclick="x()">raw</b>');
    expect(preview.querySelector('strong')).toHaveTextContent('kept');
    expect(preview.querySelector('b')).toBeNull();
  });
});

describe('MarkdownPreviewTool controls', () => {
  it('offers a copy button for the source and a clear button', () => {
    renderWith('# hi');
    expect(screen.getByRole('button', { name: 'Copy Markdown' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('Markdown')).toHaveValue('');
    expect(screen.getByText('Nothing to preview yet.')).toBeInTheDocument();
  });

  it('labels the preview region', () => {
    render(<MarkdownPreviewTool />);
    expect(screen.getByRole('region', { name: 'Preview' })).toBeInTheDocument();
  });
});
