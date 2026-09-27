import type { ReactNode } from 'react';
import { CopyButton } from './CopyButton';

interface ResultBoxProps {
  label: string;
  /** The plain-text value copied by the copy button; also the default display when `children` is omitted. */
  value: string;
  /** Custom display markup (e.g. multiple lines); falls back to `value` as plain text. */
  children?: ReactNode;
  copyLabel?: string;
}

/**
 * A single computed result: announced to assistive tech as it changes (`aria-live="polite"`) and
 * copyable. Used by tools whose workspace produces one headline value (a converted amount, a
 * calculated age, an encoded string, ...).
 */
export function ResultBox({ label, value, children, copyLabel = 'Copy result' }: ResultBoxProps) {
  return (
    <div aria-live="polite" className="rounded-control border border-border bg-surface-muted p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <div className="text-2xl font-bold break-words tracking-tight">{children ?? value}</div>
        <CopyButton text={value} label={copyLabel} />
      </div>
    </div>
  );
}
