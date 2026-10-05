import { useState } from 'react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Textarea } from '../../components/ui/Textarea';

// Only this subset is rendered. Raw HTML in the source is not parsed, so it can only ever show up
// as text, and images are not in the list (they would make the browser request an outside URL).
const ALLOWED_ELEMENTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'em',
  'strong',
  'a',
  'ul',
  'ol',
  'li',
  'code',
  'pre',
  'blockquote',
  'hr',
];

// The page already has one h1 and an h2 for the preview, so Markdown headings start at h3 and never
// go past h6; this keeps the page outline valid whatever the user types.
const heading = (tag: 'h3' | 'h4' | 'h5' | 'h6', size: string): Components['h1'] =>
  function Heading({ children }) {
    const Tag = tag;
    return <Tag className={`font-bold ${size}`}>{children}</Tag>;
  };

const components: Components = {
  h1: heading('h3', 'text-2xl'),
  h2: heading('h4', 'text-xl'),
  h3: heading('h5', 'text-lg'),
  h4: heading('h6', 'text-base'),
  h5: heading('h6', 'text-base'),
  h6: heading('h6', 'text-sm'),
  // react-markdown already blanks javascript:/data: URLs; such a link is shown as plain text instead
  // of an empty href, and real links open without leaking the opener.
  a: ({ href, children }) =>
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
};

const previewStyles =
  'min-h-40 rounded-control border border-border bg-surface p-4 break-words ' +
  '[&>*+*]:mt-3 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal ' +
  '[&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 ' +
  '[&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 ' +
  '[&_code]:font-mono [&_code]:text-sm [&_pre]:overflow-x-auto [&_pre]:rounded-control ' +
  '[&_pre]:bg-surface-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_hr]:border-border';

export function MarkdownPreviewTool() {
  const [source, setSource] = useState('');

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <Textarea
          label="Markdown"
          mono
          rows={14}
          value={source}
          onChange={(event) => setSource(event.target.value)}
          placeholder={'# Title\n\nSome **bold** and *italic* text.\n\n- a list\n- of items'}
          hint="Raw HTML is not rendered. It appears as plain text."
        />
        <section aria-labelledby="markdown-preview-heading">
          <h2 id="markdown-preview-heading" className="mb-1.5 text-sm font-semibold">
            Preview
          </h2>
          <div className={previewStyles} aria-live="polite">
            {source.trim() === '' ? (
              <p className="text-muted-foreground">Nothing to preview yet.</p>
            ) : (
              <Markdown allowedElements={ALLOWED_ELEMENTS} components={components}>
                {source}
              </Markdown>
            )}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <CopyButton text={source} label="Copy Markdown" />
        <Button variant="secondary" onClick={() => setSource('')}>
          Clear
        </Button>
      </div>
    </div>
  );
}
